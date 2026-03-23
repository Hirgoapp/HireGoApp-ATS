#!/bin/bash

# k6 Load Testing Runner Script
# Runs various load test scenarios and generates reports

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_TOKEN="${API_TOKEN:-your-test-token-here}"
RESULTS_DIR="./k6/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}ATS SaaS - k6 Load Testing Suite${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo "Results Directory: $RESULTS_DIR"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    local test_label=$3

    echo -e "${YELLOW}Running: $test_label${NC}"
    echo "Test file: $test_file"
    echo ""

    # Run k6 test with results output
    k6 run \
        --vus 1 \
        --duration 1m \
        -e BASE_URL="$BASE_URL" \
        -e API_TOKEN="$API_TOKEN" \
        --out csv="$RESULTS_DIR/${test_name}_${TIMESTAMP}.csv" \
        "$test_file"

    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ $test_label passed${NC}"
    else
        echo -e "${RED}✗ $test_label failed${NC}"
    fi
    echo ""
}

# Run baseline test
run_test "baseline" "k6/tests/load-test-baseline.js" "Baseline Load Test"

# Run spike test
run_test "spike" "k6/tests/spike-test.js" "Spike Test"

# Run stress test
run_test "stress" "k6/tests/stress-test.js" "Stress Test"

# Run endurance test
run_test "endurance" "k6/tests/endurance-test.js" "Endurance Test"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All load tests completed!${NC}"
echo -e "${GREEN}Results saved to: $RESULTS_DIR${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "To view results:"
echo "  - CSV files: $RESULTS_DIR/*.csv"
echo "  - Import into analysis tool: https://grafana.com/k6/"
