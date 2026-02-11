# API Tests Script for RepoSentry

This shell script tests all three API endpoints of the RepoSentry server.

## Script: api-tests.sh


#!/bin/bash

# RepoSentry API Tests
# Tests all detected API endpoints with colored output and summary

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMEOUT=10

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test results array
declare -a TEST_RESULTS

# ============================================================
# Helper Functions
# ============================================================

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

log_section() {
  echo ""
  echo -e "${CYAN}════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}════════════════════════════════════════════════════${NC}"
}

# Test a single API endpoint
test_endpoint() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local description=$4
  
  ((TOTAL_TESTS++))
  
  echo ""
  log_info "Test $TOTAL_TESTS: $test_name"
  echo "  Endpoint: $method $BASE_URL$endpoint"
  echo "  Description: $description"
  
  # Make request with curl
  local response=$(curl -s -w "\n%{http_code}" \
    -X "$method" \
    -H "Content-Type: application/json" \
    -H "User-Agent: RepoSentry-API-Test/1.0" \
    --max-time $TIMEOUT \
    "$BASE_URL$endpoint" 2>&1)
  
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n-1)
  
  # Check response
  if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
    log_success "$test_name returned HTTP $http_code"
    ((PASSED_TESTS++))
    TEST_RESULTS+=("${GREEN}✓${NC} $test_name (HTTP $http_code)")
    
    # Log response size
    local body_size=${#body}
    echo "  Response size: $body_size bytes"
    
    return 0
  else
    log_error "$test_name returned HTTP $http_code"
    ((FAILED_TESTS++))
    TEST_RESULTS+=("${RED}✗${NC} $test_name (HTTP $http_code)")
    
    # Show error details
    if [[ -n "$body" ]]; then
      echo "  Response: ${body:0:200}"
    fi
    
    return 1
  fi
}

# ============================================================
# Pre-test Checks
# ============================================================

log_section "PRE-TEST CHECKS"

log_info "Testing server connectivity to $BASE_URL..."
if curl -s --connect-timeout 5 "$BASE_URL/" > /dev/null 2>&1; then
  log_success "Server is reachable"
else
  log_error "Cannot connect to server at $BASE_URL"
  log_warning "Make sure the server is running: npm run start"
  exit 1
fi

# ============================================================
# API Endpoint Tests
# ============================================================

log_section "TESTING API ENDPOINTS"

# Test 1: GET / (Root endpoint)
test_endpoint \
  "Root Endpoint" \
  "GET" \
  "/" \
  "Returns the main RepoSentry HTML dashboard"

# Test 2: GET /view/*filepath (File viewer endpoint)
test_endpoint \
  "File Viewer Endpoint" \
  "GET" \
  "/view/src/server/index.ts" \
  "Returns HTML view of specific file from analysis output"

# Test 3: GET /compare (Comparison endpoint)
test_endpoint \
  "Comparison Endpoint" \
  "GET" \
  "/compare" \
  "Returns HTML comparison page with multiple file views"

# ============================================================
# Test Summary
# ============================================================

log_section "TEST SUMMARY"

echo ""
echo -e "Total Tests Run:     ${CYAN}$TOTAL_TESTS${NC}"
echo -e "Tests Passed:        ${GREEN}$PASSED_TESTS${NC}"
echo -e "Tests Failed:        ${RED}$FAILED_TESTS${NC}"

if [[ $FAILED_TESTS -eq 0 ]]; then
  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}         ✓ ALL TESTS PASSED SUCCESSFULLY!          ${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
  OVERALL_SUCCESS=true
else
  echo ""
  echo -e "${RED}═══════════════════════════════════════════════════${NC}"
  echo -e "${RED}        ✗ SOME TESTS FAILED - SEE DETAILS ABOVE     ${NC}"
  echo -e "${RED}═══════════════════════════════════════════════════${NC}"
  OVERALL_SUCCESS=false
fi

# ============================================================
# Detailed Results
# ============================================================

echo ""
log_section "DETAILED TEST RESULTS"
echo ""

for result in "${TEST_RESULTS[@]}"; do
  echo -e "  $result"
done

echo ""
log_info "Base URL: $BASE_URL"
log_info "Test Timeout: ${TIMEOUT}s"
log_info "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"

echo ""

# Exit with appropriate code
if [[ "$OVERALL_SUCCESS" == true ]]; then
  exit 0
else
  exit 1
fi
