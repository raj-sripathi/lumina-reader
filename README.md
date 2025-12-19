# Lumina Reader

A reading list management app built with Next.js that allows you to save URLs and PDFs and generate AI-powered digests.

## Features

- **Add URLs**: Paste any article URL to save for later
- **Upload PDFs**: Upload PDF documents to your reading list
- **AI Digests**: Generate concise summaries using Google's Gemini AI
- **Custom Prompts**: Edit the digest prompt to customize how content is summarized
- **Mark as Read**: Track your reading progress
- **Hybrid Database**: SQLite locally, Vercel Postgres in production

## Prerequisites

- Node.js 18+ installed
- A Google Gemini API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

## Installation

1. **Clone or navigate to the project directory**

```bash
cd lumina-reader
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Gemini API key:

```
GEMINI_API_KEY=your_actual_api_key_here
```

4. **Run the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Adding Content

1. Click the "Add" button in the header
2. Choose either "URL" or "PDF" tab
3. For URLs: Paste the article URL and click "Add"
4. For PDFs: Upload a PDF file from your computer

### Generating Digests

1. Click the "DIGEST" button on any content card
2. Click "Generate Digest" to use the default prompt
3. Or click "Custom Prompt" to write your own prompt for the AI
4. The digest will be saved and displayed in the card

### Managing Items

- **Mark as Read**: Click "Mark Read" to track completed items
- **Delete**: Click the trash icon to remove an item and its associated files

## Project Structure

```
lumina-reader/
├── app/
│   ├── api/              # API routes
│   │   ├── items/        # CRUD operations for reading items
│   │   ├── digest/       # AI digest generation
│   └── page.tsx          # Main application page
├── components/           # React components
│   ├── Header.tsx
│   ├── EmptyState.tsx
│   ├── AddModal.tsx
│   └── ContentCard.tsx
├── lib/                  # Utilities and database
│   ├── db.ts            # SQLite (local) + Postgres (Vercel) database setup
│   ├── gemini.ts        # Gemini AI integration
│   ├── content-processor.ts  # URL/PDF processing
└── uploads/             # Stored PDFs (created automatically)
```

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **SQLite**: Local database storage
- **Vercel Postgres**: Production database
- **Google Gemini AI**: AI-powered content summarization
- **better-sqlite3**: SQLite database driver
- **@vercel/postgres**: Postgres client for Vercel
- **pdf-parse**: PDF text extraction
- **cheerio**: HTML parsing for URL content extraction

## API Endpoints

- `GET /api/items` - Fetch all reading items
- `POST /api/items` - Add new URL or PDF
- `DELETE /api/items/[id]` - Delete an item
- `PATCH /api/items/[id]` - Update an item
- `POST /api/digest` - Generate AI digest

## Deployment to Vercel

This project uses SQLite locally and switches to Vercel Postgres automatically when `POSTGRES_URL` or `VERCEL` is set. Vercel Postgres has a free tier, so you can start without spending as long as you stay within its limits.

### Production Setup (Vercel)

#### 1. Database - Vercel Postgres

Create a Postgres database in your Vercel dashboard and add the connection string to your environment variables.

#### 2. File Storage - Vercel Blob

```bash
# Install Vercel Blob
npm install @vercel/blob
```

Set up Vercel Blob storage in your Vercel dashboard for storing PDFs.

#### 3. Environment Variables

Add these to your Vercel project settings:

```
GEMINI_API_KEY=your_gemini_api_key
POSTGRES_URL=your_postgres_connection_string
BLOB_READ_WRITE_TOKEN=your_blob_token
```

#### 4. Optional File Storage Migration

To move file storage to Vercel Blob:

1. **Update `lib/content-processor.ts`**:
   - Replace file system storage with Vercel Blob
   - Use `put()` to upload PDFs to blob storage
   - Store blob URLs in the database instead of file paths

2. **Update API routes**:
   - Replace file reads with blob fetches

### Local Development

Local development keeps using SQLite + file storage automatically.

**Important Notes:**
- Files in `/tmp` on Vercel are ephemeral (deleted after function execution)
- Postgres data persists across deployments when `POSTGRES_URL` is set
- For a production-ready Vercel deployment, use Postgres + Blob Storage

## Local Development Notes

- The SQLite database file (`lumina.db`) is created automatically in the project root
- Uploaded PDFs are stored in `uploads/pdfs/` (or `/tmp/pdfs/` on Vercel)
- The app uses Gemini 2.0 Flash for fast, cost-effective digest generation
- Logs are saved to `server.log` when running with the logging script

## Architecture Considerations

**Current (Local Development):**
- SQLite database for metadata
- File system for PDF storage
- Works perfectly for local development and testing

**Production (Vercel Recommended):**
- Vercel Postgres for metadata
- Vercel Blob for PDF storage
- Scalable and serverless-friendly

**Alternative Production Options:**
- Database: Upstash Redis, PlanetScale MySQL, Supabase Postgres
- Storage: AWS S3, Cloudflare R2, Supabase Storage

## License

MIT
