$ErrorActionPreference = "Stop"

Push-Location $PSScriptRoot
try {
    Write-Host "Running the verified backend test suite..." -ForegroundColor Cyan
    & ".\mvnw.cmd" "clean" "test"
    if ($LASTEXITCODE -ne 0) {
        throw "Backend tests failed with exit code $LASTEXITCODE."
    }

    Write-Host "Starting Nervix with the local compatibility profile..." -ForegroundColor Green
    & ".\mvnw.cmd" "-Dspring-boot.run.profiles=local" "spring-boot:run"
    if ($LASTEXITCODE -ne 0) {
        throw "Spring Boot stopped with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}
