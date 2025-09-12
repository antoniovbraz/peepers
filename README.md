This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Limitations

This project uses [Vercel KV](https://vercel.com/docs/storage/vercel-kv) to cache data. Operations that need to inspect or clear
the cache rely on iterating over keys with `scan`. Scanning is appropriate for small and medium datasets but it requires reading
through all matching keys and cannot efficiently paginate very large key sets.

## Environment Variables

Set the following variable to configure absolute URLs used in API calls and OAuth redirects:

- `NEXT_PUBLIC_APP_URL` – Base URL of the application (e.g., `https://peepers.vercel.app`).

## API Authentication

Sensitive API routes require a bearer token for access. Set the `ADMIN_SECRET` environment variable and include it in requests using the `Authorization` header:

```
Authorization: Bearer <your token>
```

This token is required when calling:

- `POST /api/ml/sync`
- `POST /api/products/[id]`

Requests without the correct token will receive a `401 Unauthorized` response.

## Runtime Requirements

The `/api/ml/webhook` endpoint uses `revalidatePath` to update ISR pages and therefore runs on the Node.js runtime rather than the Edge runtime.
