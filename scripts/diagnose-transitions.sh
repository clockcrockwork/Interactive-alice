#!/usr/bin/env bash
# Run the same observed index round trip against base and head. No artifacts,
# extra npm cache, credential changes, or production changes are needed.
set -euo pipefail
source_root="$PWD"
comparison_root="$(mktemp -d)"
base_sha="${ALICE_DIAGNOSTIC_BASE:?missing base SHA}"
head_sha="${ALICE_DIAGNOSTIC_HEAD:?missing head SHA}"
[[ "$base_sha" =~ ^[0-9a-f]{40}$ && "$head_sha" =~ ^[0-9a-f]{40}$ ]] || exit 2
cleanup() {
  for variant in base head; do
    git -C "$source_root" worktree remove --force "$comparison_root/$variant" 2>/dev/null || true
  done
}
trap cleanup EXIT
for variant in base head; do
  sha="$base_sha"
  if [[ "$variant" == head ]]; then sha="$head_sha"; fi
  root="$comparison_root/$variant"
  git fetch --depth=1 origin "$sha"
  git worktree add --detach "$root" "$sha"
  ln -s "$source_root/node_modules" "$root/node_modules"
  # The identical test and observer run against both exact application commits.
  cp "$source_root/tests/play/japanese.spec.ts" "$root/tests/play/japanese.spec.ts"
  cp "$source_root/tests/transition-diagnostics.ts" "$root/tests/transition-diagnostics.ts"
done
status=0
for variant in base head; do
  root="$comparison_root/$variant"
  echo "::group::Transition diagnosis: $variant"
  echo "Application commit: $(git -C "$root" rev-parse HEAD)"
  result=0
  (
    cd "$root"
    npm run build || exit $?
    ALICE_TRANSITION_DIAGNOSTICS=1 npx playwright test --project=chromium-desktop \
      tests/play/japanese.spec.ts --grep 'the index:' --workers=1 --repeat-each=5 --trace=off
  ) || result=$?
  echo "::endgroup::"
  echo "Transition diagnosis $variant exit status: $result"
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    printf '\n- Transition diagnosis %s: exit %s (five index round trips; lifecycle/CSS observations in job log).\n' "$variant" "$result" >> "$GITHUB_STEP_SUMMARY"
  fi
  if [[ "$result" != 0 ]]; then status=1; fi
done
exit "$status"
