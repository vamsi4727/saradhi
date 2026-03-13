import yfinance as yf


def get_stock_data(symbol: str) -> dict:
    """symbol format: 'HDFCBANK.NS' for NSE, 'HDFCBANK.BO' for BSE"""
    ticker = yf.Ticker(symbol)
    info = ticker.info
    hist = ticker.history(period="30d")

    sparkline = []
    if hist is not None and not hist.empty and "Close" in hist.columns:
        sparkline = hist["Close"].tolist()[-10:]

    change_pct = 0
    if info.get("regularMarketChangePercent"):
        change_pct = round(info["regularMarketChangePercent"], 2)
    elif info.get("52WeekChange"):
        change_pct = round(info["52WeekChange"] * 100, 2)

    return {
        "symbol": symbol,
        "name": info.get("longName") or info.get("shortName") or symbol,
        "price": info.get("currentPrice") or info.get("regularMarketPrice"),
        "change_pct": change_pct,
        "pe_ratio": info.get("trailingPE"),
        "de_ratio": info.get("debtToEquity"),
        "eps": info.get("trailingEps"),
        "market_cap": info.get("marketCap"),
        "sector": info.get("sector"),
        "one_year_return": round((info.get("52WeekChange") or 0) * 100, 2),
        "sparkline": sparkline,
    }
