# OpenAI Integration for EduKanban

## Overview
The EduKanban platform now uses real OpenAI API to generate comprehensive, personalized courses on-demand.

## Features Implemented

### 1. **Real-time AI Course Generation**
- Uses OpenAI GPT-4 Turbo to generate courses
- Creates detailed, structured educational content
- Generates 4-6 modules per course with rich content
- Each module includes:
  - Learning objectives
  - Educational content (200-400 words)
  - Practical tasks and exercises
  - Resources and references

### 2. **Smart Caching System**
- First request: Generates course with OpenAI and caches as template
- Subsequent requests: Uses cached template (saves API costs)
- Template matching based on:
  - Course topic
  - Knowledge level
  - Time commitment

### 3. **Regeneration Feature**
- Users can regenerate courses if not satisfied
- Bypasses cache to create fresh AI-generated content
- New endpoint: `POST /api/ai/regenerate-course`
- Front-end button: "Regenerate with AI"

### 4. **Fallback System**
- If OpenAI API key is not configured, uses mock data
- Graceful degradation ensures platform always works
- Console logs indicate whether AI or mock data is used

## API Endpoints

### Generate Course (with caching)
```
POST /api/ai/generate-course
```

**Request:**
```json
{
  "courseTopic": "React Hooks",
  "knowledgeLevel": "Intermediate",
  "timeCommitment": "10 hours per week"
}
```

**Response:**
```json
{
  "success": true,
  "message": "New course generated with AI and saved as template",
  "fromCache": false,
  "generatedWithAI": true,
  "templateId": "...",
  "data": {
    "course": {
      "_id": "...",
      "title": "Mastering React Hooks",
      "description": "...",
      "modules": [...],
      "difficulty": "Intermediate",
      "estimatedDuration": 10
    }
  }
}
```

### Regenerate Course (bypass cache)
```
POST /api/ai/regenerate-course
```

Same request/response structure, but always generates fresh content.

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...your-key-here...
```

### Getting an OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create new secret key
5. Copy the key to your `.env` file

### Cost Considerations

- **Model**: GPT-4 Turbo Preview
- **Average Cost**: ~$0.01-0.03 per course generation
- **Caching**: Reduces costs by 90%+ for popular topics
- **Tip**: Monitor usage at https://platform.openai.com/usage

## OpenAI Service

Located at: `backend/services/OpenAIService.js`

### Key Methods

#### `generateCourse(params)`
Generates a complete course structure using OpenAI.

**Parameters:**
- `courseTopic`: String - The course subject
- `knowledgeLevel`: String - Beginner | Intermediate | Advanced | Expert
- `timeCommitment`: String - Expected time commitment

**Returns:** Complete course structure

#### `generateModuleContent(moduleTitle, courseTopic)`
Generates detailed content for a specific module.

#### `isConfigured()`
Checks if OpenAI API key is properly set up.

## Prompt Engineering

The system uses carefully crafted prompts to ensure high-quality output:

```javascript
{
  "role": "system",
  "content": "You are an expert educational content creator..."
}
```

The user prompt includes:
- Topic and level specifications
- Detailed structure requirements
- JSON format specification
- Quality guidelines

## Response Format

OpenAI is instructed to return JSON in this structure:

```json
{
  "title": "Course title",
  "description": "Course description",
  "modules": [
    {
      "moduleNumber": 1,
      "title": "Module title",
      "description": "Module description",
      "learningObjectives": ["..."],
      "estimatedDuration": 2,
      "content": "Detailed educational content...",
      "tasks": [
        {
          "title": "Task title",
          "description": "Task description",
          "type": "reading|exercise|quiz|project|assignment",
          "estimatedTime": 30,
          "difficulty": "Easy|Medium|Hard",
          "instructions": "Step-by-step instructions",
          "order": 1
        }
      ],
      "resources": [...]
    }
  ],
  "learningOutcomes": ["..."],
  "prerequisites": ["..."],
  "tags": ["..."]
}
```

## User Flow

### First-Time Generation
1. User fills course generation form
2. System checks cache for existing template
3. If not found, calls OpenAI API
4. OpenAI generates comprehensive course
5. System saves as template for future use
6. Course displayed to user

### Regeneration
1. User views generated course
2. If not satisfied, clicks "Regenerate with AI"
3. System bypasses cache
4. Fresh course generated with OpenAI
5. New template created
6. User sees updated course

## Error Handling

### OpenAI API Errors
- Network errors: Retry with exponential backoff
- Rate limits: Graceful degradation to mock data
- Invalid responses: Fallback to template structure

### Logging
All generation attempts are logged:
- Success/failure status
- Generation time
- User details
- Error messages (if any)

## Benefits

### For Users
- ✅ Instant course generation
- ✅ Personalized to their level
- ✅ Comprehensive, structured content
- ✅ Ability to regenerate if not satisfied
- ✅ Professional-quality courses

### For Platform
- ✅ Automated content creation
- ✅ Cost-effective with caching
- ✅ Scalable to any topic
- ✅ Always up-to-date content
- ✅ User satisfaction through regeneration

## Future Enhancements

### Planned Features
- [ ] Custom AI models fine-tuned on educational content
- [ ] Multi-language course generation
- [ ] User feedback integration for prompt improvement
- [ ] Advanced caching with similarity matching
- [ ] Incremental course updates based on user progress
- [ ] Video content suggestions via YouTube API
- [ ] Interactive quizzes auto-generated from content

### Optimization
- [ ] Cache warming for popular topics
- [ ] Batch generation for multiple users
- [ ] A/B testing different prompts
- [ ] User preference learning

## Monitoring

### Metrics to Track
- OpenAI API usage and costs
- Cache hit rate
- Generation success rate
- Average generation time
- User satisfaction (regeneration rate)

### Dashboard (Future)
Create admin dashboard showing:
- Daily AI generations
- Cost per course
- Popular topics
- Cache efficiency
- Error rates

## Troubleshooting

### Issue: "Failed to generate course"
**Cause**: OpenAI API key not configured or invalid
**Solution**: Check `.env` file and verify API key

### Issue: Slow generation
**Cause**: OpenAI API response time
**Solution**: Normal, takes 5-15 seconds for quality content

### Issue: Using mock data instead of AI
**Cause**: OpenAI not configured
**Solution**: Add valid API key to `.env`

### Issue: Rate limit errors
**Cause**: Too many requests to OpenAI
**Solution**: 
- Increase cache usage
- Upgrade OpenAI plan
- Implement request queuing

## Security

### API Key Protection
- ✅ Stored in environment variables
- ✅ Never exposed to frontend
- ✅ Not committed to version control
- ✅ Separate keys for dev/prod

### Best Practices
1. Rotate API keys regularly
2. Monitor usage for anomalies
3. Set spending limits in OpenAI dashboard
4. Use separate keys per environment
5. Implement rate limiting

## Testing

### Manual Testing
1. Generate course with OpenAI enabled
2. Generate same course again (should use cache)
3. Click "Regenerate" (should create new version)
4. Test with OpenAI disabled (should use mock data)

### Automated Testing (Future)
- Unit tests for OpenAIService
- Integration tests for course generation
- Load testing for concurrent generations
- Cost simulation tests

## Documentation Links

- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [GPT-4 Turbo Guide](https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
