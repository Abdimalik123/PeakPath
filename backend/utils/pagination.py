"""
Pagination and filtering utilities
"""
from flask import request, jsonify


def paginate_query(query, page=1, per_page=10):
    """
    Paginate a SQL query string
    
    Args:
        query: Base SQL query string
        page: Page number (1-indexed)
        per_page: Items per page
    
    Returns:
        tuple: (paginated_query, offset, limit)
    """
    offset = (page - 1) * per_page
    limit = per_page
    
    paginated_query = f"{query} LIMIT %s OFFSET %s"
    return paginated_query, limit, offset


def get_pagination_params():
    """
    Extract pagination parameters from request
    
    Returns:
        dict: {page, per_page}
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Validate
    page = max(1, page)
    per_page = min(max(1, per_page), 100)  # Max 100 items per page
    
    return {'page': page, 'per_page': per_page}


def create_pagination_response(items, total_count, page, per_page):
    """
    Create a standardized pagination response
    
    Args:
        items: List of items for current page
        total_count: Total number of items
        page: Current page number
        per_page: Items per page
    
    Returns:
        dict: Pagination response with metadata
    """
    total_pages = (total_count + per_page - 1) // per_page  # Ceiling division
    
    return {
        "success": True,
        "data": items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_items": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }


def get_date_range_params():
    """
    Extract date range parameters from request
    
    Returns:
        dict: {start_date, end_date} or None if not provided
    """
    from datetime import datetime
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    result = {}
    
    if start_date:
        try:
            result['start_date'] = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return None
    
    if end_date:
        try:
            result['end_date'] = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return None
    
    return result if result else None


def get_search_params():
    """
    Extract search parameters from request
    
    Returns:
        dict: {search, type, category, etc.}
    """
    return {
        'search': request.args.get('search', '').strip(),
        'type': request.args.get('type', '').strip(),
        'category': request.args.get('category', '').strip(),
        'status': request.args.get('status', '').strip()
    }


def build_where_clause(filters):
    """
    Build SQL WHERE clause from filters
    
    Args:
        filters: Dict of filter conditions
    
    Returns:
        tuple: (where_clause, params)
    """
    conditions = []
    params = []
    
    for key, value in filters.items():
        if value:
            conditions.append(f"{key} = %s")
            params.append(value)
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    return where_clause, params


def build_search_clause(search_term, search_fields):
    """
    Build SQL search clause for multiple fields
    
    Args:
        search_term: Search string
        search_fields: List of field names to search
    
    Returns:
        tuple: (search_clause, params)
    """
    if not search_term:
        return "1=1", []
    
    conditions = [f"{field} ILIKE %s" for field in search_fields]
    search_clause = f"({' OR '.join(conditions)})"
    params = [f"%{search_term}%" for _ in search_fields]
    
    return search_clause, params
