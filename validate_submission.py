"""
Validation Script for Gradience Hackathon Submission.

Checks documentation files, runs pytest test suite, runs frontend oxlint,
and verifies repo readiness for FortyGuard Global AI Hackathon 2026.
"""
import os
import subprocess
import sys

def check_file(path, label):
    if os.path.exists(path):
        print(f"  [OK] {label}: {path}")
        return True
    else:
        print(f"  [FAIL] Missing {label}: {path}")
        return False

def main():
    print("=" * 60)
    print("  GRADIENCE SUBMISSION VALIDATION AUDIT")
    print("=" * 60)

    repo_root = r"d:\agy_projects\gradience"

    # 1. Documentation files
    print("\n1. Checking Documentation Files...")
    doc_files = [
        ("README.md", "README Document"),
        ("TECHNICAL_NOTES.md", "Technical Implementation Notes"),
        ("CONTRIBUTING.md", "Contributing Guidelines"),
        ("SECURITY.md", "Security Policy"),
        ("LICENSE", "MIT License File"),
        (".env.example", "Root Environment Example"),
        ("apps/api/.env.example", "API Environment Example"),
        (".github/SUBMISSION_CHECKLIST.md", "Submission Checklist"),
    ]

    all_docs_ok = True
    for rel_path, label in doc_files:
        full_p = os.path.join(repo_root, rel_path)
        if not check_file(full_p, label):
            all_docs_ok = False

    # 2. Python Test Suite
    print("\n2. Running Python API Test Suite...")
    env = os.environ.copy()
    env["PYTHONPATH"] = r"src;..\..\packages\city-domain\src;..\..\packages\thermal-providers\src"
    pytest_res = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/", "-v"],
        cwd=os.path.join(repo_root, "apps", "api"),
        env=env,
        capture_output=True,
        text=True
    )
    if pytest_res.returncode == 0:
        print("  [OK] Python Test Suite PASSED (100% green)")
    else:
        print("  [FAIL] Pytest failed:")
        print(pytest_res.stdout)
        print(pytest_res.stderr)

    # 3. Frontend Oxlint
    print("\n3. Running Frontend Oxlint...")
    oxlint_res = subprocess.run(
        ["npx.cmd" if os.name == "nt" else "npx", "oxlint@latest", "src/", "--deny-warnings"],
        cwd=os.path.join(repo_root, "apps", "web"),
        capture_output=True,
        text=True,
        shell=True
    )
    if oxlint_res.returncode == 0:
        print("  [OK] Frontend Oxlint PASSED (0 warnings/errors)")
    else:
        print("  [WARN] Oxlint output:")
        print(oxlint_res.stdout or oxlint_res.stderr)

    # 4. Summary
    print("\n" + "=" * 60)
    if all_docs_ok and pytest_res.returncode == 0:
        print("  STATUS: SUBMISSION READY FOR FORTYGUARD HACKATHON 2026")
    else:
        print("  STATUS: ISSUES DETECTED - PLEASE REVIEW ABOVE")
    print("=" * 60)

if __name__ == "__main__":
    main()
