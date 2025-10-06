// site/src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <main style={{minHeight:"100vh",display:"grid",placeItems:"center",textAlign:"center",padding:"2rem"}}>
          <div>
            <h1 style={{fontSize:"2rem",marginBottom:"0.5rem"}}>Page not found</h1>
            <p style={{opacity:0.8,marginBottom:"1rem"}}>Sorry, we couldn’t find what you were looking for.</p>
            <Link href="/" style={{textDecoration:"underline"}}>Go back home</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
