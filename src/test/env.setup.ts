// Runs before any test file is imported, so config/env.ts's Zod validation
// (which runs at import time) sees a complete, schema-valid environment —
// none of these are real credentials.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/delivery_test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_for_unit_tests';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy_secret_for_unit_tests';
process.env.GOOGLE_MAPS_API_KEY = 'test_maps_key';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_USER = 'test_user';
process.env.SMTP_PASS = 'test_pass';
process.env.EMAIL_FROM = 'noreply@example.com';
