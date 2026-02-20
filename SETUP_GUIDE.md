# Environment Configuration Setup

If you are seeing a blank screen or a loading spinner that won't disappear, it is likely because **Supabase** is not configured.

### 1. Create a `.env` file
Create a file named `.env` in the root of your project (`d:\afrgam\.env`) and add your Supabase credentials:

```bash
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 2. Check the Browser Console
I have added debug logs to help us identify the issue. 
1. Open your browser to `http://localhost:5173/`.
2. Press `F12` (or Right Click > Inspect) and go to the **Console** tab.
3. Look for logs starting with `Auth:` or `Supabase Initialization:`.

If you see `Missing`, please add the keys to your `.env` file and restart the dev server!
