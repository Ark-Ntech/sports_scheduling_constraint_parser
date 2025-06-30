# 🚀 Vercel Deployment Guide

This guide walks you through deploying the Sports Scheduling Constraint Parser to Vercel with all the latest features and improvements.

## ✅ Pre-Deployment Checklist

### 1. Code Quality & Testing

Run these commands to ensure everything is ready:

```bash
# Lint and fix any issues
pnpm run lint

# Format code
pnpm run format

# Build locally to verify
pnpm run build

# Run tests
pnpm run test
```

### 2. Environment Variables Setup

Ensure your `.env.local` file contains all required variables:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Hugging Face API Configuration (Required)
HUGGINGFACE_API_TOKEN=your_huggingface_token
HUGGINGFACE_API_KEY=your_huggingface_token
HF_TOKEN=your_huggingface_token

# Authentication (Required)
AUTH_SECRET=your_random_auth_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# OpenAI API Configuration (Optional - for enhanced explanations)
OPENAI_API_KEY=your_openai_api_key

# Database Configuration (Optional)
DATABASE_URL=your_database_url
```

### 3. Database Setup

Ensure your Supabase database is properly configured:

- [ ] Run `database-setup.sql` in Supabase SQL editor
- [ ] Verify all tables are created
- [ ] Test authentication flow
- [ ] Confirm constraint storage works

## 🚀 Deployment Steps

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Method 2: GitHub Integration

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure build settings

## ⚙️ Vercel Configuration

### Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Node.js Version**: 18.x

### Environment Variables in Vercel Dashboard

Add these in your Vercel project settings:

```env
# Production Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

HUGGINGFACE_API_TOKEN=your_huggingface_token
HUGGINGFACE_API_KEY=your_huggingface_token
HF_TOKEN=your_huggingface_token

AUTH_SECRET=your_random_auth_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.vercel.app

# Optional
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url
```

**⚠️ Important Notes:**

- Update `NEXTAUTH_URL` to your actual Vercel domain
- Keep all secrets secure
- Use production Supabase URLs, not development ones

## 🧪 Post-Deployment Testing

### 1. Basic Functionality

- [ ] Visit your deployed URL
- [ ] Test authentication (login/logout)
- [ ] Try parsing a simple constraint
- [ ] Verify constraint storage
- [ ] Check calendar functionality

### 2. Advanced Features

- [ ] Test multiple constraint detection
- [ ] Verify confidence scoring shows real values
- [ ] Test entity detection (teams, venues, numbers)
- [ ] Check constraint set management
- [ ] Verify calendar navigation from constraint sets

### 3. Performance Tests

- [ ] Test complex multi-constraint input
- [ ] Verify response times (<10s for complex inputs)
- [ ] Check confidence scoring accuracy
- [ ] Test all constraint types (temporal, capacity, location, rest)

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures

**Error**: `Module not found`
**Solution**:

```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

#### 2. Environment Variable Issues

**Error**: `HuggingFace parser initialization failed`
**Solution**:

- Verify `HUGGINGFACE_API_TOKEN` is set correctly
- Check token format starts with `hf_`
- Ensure token has read permissions

#### 3. Database Connection Issues

**Error**: Database connection failed
**Solution**:

- Verify Supabase URLs are production URLs
- Check service role key permissions
- Ensure database tables exist

#### 4. Authentication Issues

**Error**: NextAuth configuration error
**Solution**:

- Update `NEXTAUTH_URL` to your production domain
- Verify `AUTH_SECRET` is set
- Check Supabase auth configuration

### Debugging Tips

1. **Check Vercel Function Logs**

   - Go to Vercel dashboard → Functions tab
   - Look for error messages in function logs

2. **Monitor Console Logs**

   - Open browser developer tools
   - Check for JavaScript errors
   - Look for network request failures

3. **Test API Endpoints**
   ```bash
   # Test parsing endpoint
   curl -X POST https://your-domain.vercel.app/api/parse \
     -H "Content-Type: application/json" \
     -d '{"text":"No more than 3 games per day"}'
   ```

## 📊 Performance Optimization

### Vercel-Specific Optimizations

1. **Function Configuration**

   - Functions timeout: 60 seconds (for complex ML processing)
   - Memory allocation: 1024 MB (for HuggingFace models)

2. **Caching Strategy**

   - Static assets: Cached indefinitely
   - API responses: No cache (real-time parsing)
   - Database queries: Consider implementing SWR

3. **Bundle Optimization**
   - Tree shaking enabled
   - Dynamic imports for heavy components
   - Optimized image loading

## 🔒 Security Considerations

### Environment Variables

- [ ] All secrets properly configured in Vercel
- [ ] No sensitive data in client-side code
- [ ] API keys have minimal required permissions

### Database Security

- [ ] Row-level security enabled in Supabase
- [ ] Proper user authentication flow
- [ ] Constraint data properly isolated by user

### API Security

- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive information

## 📈 Monitoring & Analytics

### Built-in Analytics

The app includes Vercel Analytics for monitoring:

- Page views and user interactions
- Performance metrics
- Error tracking
- User flow analysis

### Custom Monitoring

Monitor these key metrics:

- **Parse Success Rate**: >95%
- **Average Response Time**: <8s for complex constraints
- **User Engagement**: Constraint creation and calendar usage
- **Error Rates**: <5% for all operations

## 🚀 Going Live

### Final Pre-Launch Checklist

- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Error handling tested
- [ ] User flows verified
- [ ] Security review completed

### Launch Steps

1. **Deploy to Production**

   ```bash
   vercel --prod
   ```

2. **Update Documentation**

   - Update README with production URL
   - Verify all links work
   - Test examples with production system

3. **Monitor Initial Traffic**

   - Watch Vercel analytics
   - Monitor function logs
   - Check error rates

4. **User Feedback**
   - Test core user journeys
   - Gather feedback on performance
   - Monitor support channels

## 🎉 Success Metrics

Your deployment is successful when:

- ✅ **Constraint Parsing**: 96%+ accuracy with real confidence scores
- ✅ **Multiple Constraints**: Automatic detection and splitting
- ✅ **Entity Recognition**: Teams, venues, numbers properly detected
- ✅ **JSON Output**: Perfect formatting matching specifications
- ✅ **UI Functionality**: Calendar navigation, constraint management working
- ✅ **Performance**: <8s response times for complex inputs
- ✅ **Reliability**: 99%+ uptime with graceful fallbacks

## 📞 Support

If you encounter issues during deployment:

1. Check this guide's troubleshooting section
2. Review Vercel function logs
3. Test with simple inputs first
4. Verify all environment variables
5. Open an issue on GitHub with deployment logs

**🎯 Your Sports Scheduling Constraint Parser is now ready for production with enterprise-grade ML parsing, multiple constraint detection, and perfect JSON output!**
