# Supabase Security Checklist

## ✅ Database Security

### Row Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Create policies for authenticated users only
- [ ] Test policies with different user roles

### Example RLS Policies:
```sql
-- Enable RLS on tours table
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tours
CREATE POLICY "Users can view own tours" ON tours
  FOR SELECT USING (auth.uid() = created_by);

-- Users can only create tours for themselves
CREATE POLICY "Users can create own tours" ON tours
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can only update their own tours
CREATE POLICY "Users can update own tours" ON tours
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can only delete their own tours
CREATE POLICY "Users can delete own tours" ON tours
  FOR DELETE USING (auth.uid() = created_by);
```

## ✅ Authentication Security

### Email Settings
- [ ] Configure custom SMTP (not Supabase's default)
- [ ] Set up proper email templates
- [ ] Enable email confirmation

### Password Policies
- [ ] Set minimum password length (8+ characters)
- [ ] Enable password strength requirements
- [ ] Set session timeout

### OAuth Providers
- [ ] Configure OAuth providers properly
- [ ] Set correct redirect URLs
- [ ] Use HTTPS only

## ✅ API Security

### Rate Limiting
- [ ] Enable rate limiting in Supabase dashboard
- [ ] Set appropriate limits for your use case
- [ ] Monitor API usage

### CORS Settings
- [ ] Configure CORS for your domain only
- [ ] Don't use wildcard (*) in production
- [ ] Test CORS with your deployed domain

## ✅ Environment Security

### Production Environment
- [ ] Use environment variables (not hardcoded values)
- [ ] Different Supabase project for production
- [ ] Enable database backups
- [ ] Monitor database usage

### Development Environment
- [ ] Separate Supabase project for development
- [ ] Don't use production data in development
- [ ] Use test data for development

## ✅ Monitoring & Logging

### Supabase Dashboard
- [ ] Monitor API usage regularly
- [ ] Check for unusual activity
- [ ] Set up alerts for high usage

### Application Logging
- [ ] Log authentication events
- [ ] Log data access patterns
- [ ] Monitor error rates

## 🚨 Security Red Flags

### Never Do This:
- ❌ Hardcode service role key in client code
- ❌ Disable RLS on production tables
- ❌ Use wildcard CORS in production
- ❌ Store sensitive data without encryption
- ❌ Skip email verification
- ❌ Use weak password policies

### Always Do This:
- ✅ Use anon key for client-side code
- ✅ Enable RLS on all tables
- ✅ Use environment variables
- ✅ Test your security policies
- ✅ Monitor API usage
- ✅ Keep Supabase updated