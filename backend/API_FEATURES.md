# API Features Documentation

## ✅ Implemented Features

### 1. CORS Configuration
**Status:** ✅ Completed

**Configuration:**
- Specific origins allowed (configurable via `.env`)
- Default origins: `http://localhost:3000`, `http://localhost:5173`
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Credentials support enabled
- Max age: 3600 seconds

**Environment Variable:**
```bash
FRONTEND_URL=http://localhost:3000
```

---

### 2. Input Validation
**Status:** ✅ Completed

**Library:** Marshmallow 3.23.1

**Available Schemas:**
- `WorkoutSchema` - Workout creation validation
- `ExerciseSchema` - Exercise validation
- `HabitSchema` - Habit creation validation
- `HabitLogSchema` - Habit logging validation
- `GoalSchema` - Goal creation validation
- `GoalLinkSchema` - Goal linking validation
- `WeightLogSchema` - Weight logging validation
- `UserProfileSchema` - User profile validation
- `PaginationSchema` - Pagination parameters validation
- `DateRangeSchema` - Date range validation

**Usage Example:**
```python
from utils.validators import validate_request, WorkoutSchema

@validate_request(WorkoutSchema)
def create_workout():
    data = request.validated_data
    # data is now validated and cleaned
```

**Validation Features:**
- Type checking
- Range validation
- Length validation
- Required fields
- Custom validators
- Automatic error messages

---

### 3. Pagination
**Status:** ✅ Completed

**Endpoints with Pagination:**
- `GET /workouts` - List workouts
- `GET /habits` - List habits
- `GET /goals` - List goals

**Query Parameters:**
```
?page=1&per_page=10
```

**Default Values:**
- `page`: 1
- `per_page`: 10
- `max_per_page`: 100

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total_items": 45,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

---

### 4. Search & Filtering
**Status:** ✅ Completed

#### **Workouts Endpoint** (`GET /workouts`)

**Query Parameters:**
```
?search=bench           # Search in notes
?type=Strength          # Filter by workout type
?start_date=2024-01-01  # Filter by date range
?end_date=2024-12-31
?page=1&per_page=10     # Pagination
```

**Examples:**
```bash
# Get strength workouts
GET /workouts?type=Strength

# Search for specific exercises in notes
GET /workouts?search=bench

# Get workouts in date range
GET /workouts?start_date=2024-11-01&end_date=2024-11-30

# Combined filters with pagination
GET /workouts?type=Cardio&start_date=2024-11-01&page=2&per_page=20
```

---

#### **Habits Endpoint** (`GET /habits`)

**Query Parameters:**
```
?search=meditation      # Search in name and description
?type=daily            # Filter by frequency (daily/weekly/monthly)
?page=1&per_page=10    # Pagination
```

**Examples:**
```bash
# Get daily habits
GET /habits?type=daily

# Search for meditation habits
GET /habits?search=meditation

# Combined filters
GET /habits?type=weekly&search=exercise&page=1
```

---

#### **Goals Endpoint** (`GET /goals`)

**Query Parameters:**
```
?search=workout         # Search in goal name
?category=fitness      # Filter by category
?status=active         # Filter by status (active/completed)
?page=1&per_page=10    # Pagination
```

**Examples:**
```bash
# Get active goals
GET /goals?status=active

# Get completed fitness goals
GET /goals?category=fitness&status=completed

# Search for workout-related goals
GET /goals?search=workout

# Combined filters
GET /goals?category=fitness&status=active&page=1&per_page=20
```

---

## 🔧 Utility Functions

### Pagination Utilities (`utils/pagination.py`)

```python
from utils.pagination import (
    get_pagination_params,
    create_pagination_response,
    get_date_range_params,
    get_search_params,
    paginate_query
)

# Get pagination parameters from request
pagination = get_pagination_params()  # {page: 1, per_page: 10}

# Get date range from request
date_range = get_date_range_params()  # {start_date: ..., end_date: ...}

# Get search parameters
search = get_search_params()  # {search: ..., type: ..., category: ..., status: ...}

# Create paginated response
response = create_pagination_response(items, total_count, page, per_page)
```

### Validation Utilities (`utils/validators.py`)

```python
from utils.validators import validate_request, validate_query_params

# Validate request body
@validate_request(WorkoutSchema)
def create_workout():
    data = request.validated_data
    ...

# Validate query parameters
@validate_query_params(PaginationSchema)
def get_workouts():
    params = request.validated_params
    ...
```

---

## 📝 Installation

**Install new dependencies:**
```bash
pip install -r requirements.txt
```

**New dependency added:**
- `marshmallow==3.23.1`

---

## 🧪 Testing Examples

### Test Pagination
```bash
# First page
curl "http://localhost:5000/workouts?page=1&per_page=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Second page
curl "http://localhost:5000/workouts?page=2&per_page=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Search
```bash
# Search workouts
curl "http://localhost:5000/workouts?search=bench" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search habits
curl "http://localhost:5000/habits?search=meditation" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Filtering
```bash
# Filter workouts by type
curl "http://localhost:5000/workouts?type=Strength" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter goals by status
curl "http://localhost:5000/goals?status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Date range filter
curl "http://localhost:5000/workouts?start_date=2024-11-01&end_date=2024-11-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Combined
```bash
# Pagination + Search + Filter
curl "http://localhost:5000/workouts?type=Cardio&search=running&start_date=2024-11-01&page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔒 Security Improvements

1. **CORS:** Restricted to specific origins
2. **Input Validation:** All inputs validated before processing
3. **SQL Injection:** Parameterized queries used throughout
4. **Error Handling:** Proper error messages without exposing internals

---

## 📊 Performance Improvements

1. **Pagination:** Prevents loading large datasets
2. **Indexed Queries:** Uses existing database indexes
3. **Efficient Counting:** Separate count queries for pagination
4. **Filtered Results:** Reduces data transfer

---

## 🚀 Next Steps (Optional)

1. Add rate limiting
2. Add caching for frequently accessed data
3. Add API versioning
4. Add request/response compression
5. Add API documentation (Swagger/OpenAPI)
