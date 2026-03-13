"""NSE stock data via nsetools - primary source for Indian stocks."""

from nsetools import Nse

# Fallback names when nsetools doesn't provide companyName (v2 returns minimal keys)
SYMBOL_NAMES = {
    "HDFCBANK": "HDFC Bank",
    "INFY": "Infosys",
    "TCS": "Tata Consultancy Services",
    "NESTLEIND": "Nestlé India",
    "TATAMOTORS": "Tata Motors",
    "AXISBANK": "Axis Bank",
    "SUNPHARMA": "Sun Pharma",
    "MARUTI": "Maruti Suzuki",
    "ADANIENT": "Adani Enterprises",
    "ZOMATO": "Zomato",
    "IRCTC": "IRCTC",
    "NYKAA": "Nykaa",
}


def get_stock_data(symbol: str) -> dict:
    """
    Fetch NSE stock data. Symbol format: 'HDFCBANK' or 'HDFCBANK.NS' (strip .NS for NSE).
    Returns dict in same shape as yfinance_service for compatibility.
    nsetools v2 returns: lastPrice, pChange, weekHighLow, etc.
    """
    nse = Nse()
    nse_symbol = symbol.replace(".NS", "").replace(".BO", "").strip() if symbol else ""
    if not nse_symbol:
        raise ValueError("Invalid symbol")

    quote = nse.get_quote(nse_symbol)
    if not quote:
        raise ValueError(f"No quote found for {nse_symbol}")

    def _num(val, default=None):
        if val is None or val == "-" or val == "":
            return default
        try:
            return float(str(val).replace(",", ""))
        except (ValueError, TypeError):
            return default

    last_price = _num(quote.get("lastPrice") or quote.get("close"))
    p_change = _num(quote.get("pChange"), 0)

    # weekHighLow: {min, max, value} - 52-week style data
    whl = quote.get("weekHighLow") or {}
    high52 = _num(whl.get("max"))
    low52 = _num(whl.get("min"))
    one_year = (
        round((last_price - low52) / (high52 - low52) * 100, 2)
        if (high52 and low52 and high52 != low52)
        else None
    )

    return {
        "symbol": symbol,
        "name": quote.get("companyName") or SYMBOL_NAMES.get(nse_symbol, nse_symbol),
        "price": last_price,
        "change_pct": p_change,
        "pe_ratio": None,  # nsetools v2 doesn't expose P/E
        "de_ratio": None,
        "eps": None,
        "market_cap": None,
        "sector": None,
        "one_year_return": one_year,
        "sparkline": [],  # nsetools doesn't provide history
    }
