# Admin Statistics API

This document describes the new statistics endpoints available for admin users.

## Authentication

All endpoints require admin authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_admin_token>
```

## Endpoints

### 1. Average Voice Messages Per User

**GET** `/api/v1/admin/statistics/voice-messages-average`

Returns the average number of voice messages per user.

**Response:**
```json
{
  "success": true,
  "data": {
    "averageVoiceMessagesPerUser": 5.25,
    "totalVoiceMessages": 120,
    "usersWithVoiceMessages": 23
  },
  "message": "Average voice messages per user"
}
```

### 2. Community Emotion Trends

**GET** `/api/v1/admin/statistics/community-emotions`

Returns emotion trends for the community over a specified period.

**Query Parameters:**
- `period` (optional): 'day', 'week', or 'month'. Default is 'week'.

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "startDate": "2023-05-01T00:00:00.000Z",
    "endDate": "2023-05-08T00:00:00.000Z",
    "emotions": {
      "joie": 25,
      "tristesse": 12,
      "colere": 8,
      "anxiete": 15,
      "peur": 5,
      "neutre": 30
    }
  },
  "message": "Community emotion trends for week"
}
```

### 3. User Emotional Curve

**GET** `/api/v1/admin/statistics/user-emotions/:userId`

Returns the emotional curve for a specific user over time.

**Path Parameters:**
- `userId`: The ID of the user to get emotional data for.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "emotionCurve": [
      {
        "date": "2023-05-01T10:30:00.000Z",
        "emotion": "joie",
        "type": "session"
      },
      {
        "date": "2023-05-02T14:15:00.000Z",
        "emotion": "anxiete",
        "type": "message"
      }
    ],
    "totalDataPoints": 15
  },
  "message": "User emotional curve"
}
```

## Error Responses

All endpoints follow the standard API error response format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": 400
  }
}
```

Common error codes:
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (user is not an admin)
- 400: Bad Request (invalid parameters)
- 500: Internal Server Error (unexpected server error)