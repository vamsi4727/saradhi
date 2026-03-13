from fastapi import APIRouter

router = APIRouter()

FD_RATES = {
    "SBI": {"1yr": 6.80, "2yr": 7.00, "3yr": 6.75, "5yr": 6.50},
    "HDFC Bank": {"1yr": 6.60, "2yr": 7.00, "3yr": 7.00, "5yr": 7.00},
    "ICICI Bank": {"1yr": 6.70, "2yr": 7.00, "3yr": 7.00, "5yr": 7.00},
    "Bajaj Finance": {"1yr": 7.40, "2yr": 7.80, "3yr": 8.05, "5yr": 8.05},
    "Axis Bank": {"1yr": 6.70, "2yr": 7.10, "3yr": 7.10, "5yr": 7.00},
}


@router.get("/rates")
def get_fd_rates():
    return FD_RATES
