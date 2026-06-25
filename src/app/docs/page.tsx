import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Dokümantasyonu",
  robots: { index: false },
};

// Swagger UI — /api/docs OpenAPI spec'ini CDN'den yüklenen Swagger UI ile gösterir.
export default function ApiDocsPage() {
  return (
    <div>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      <div id="swagger-ui" />
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" async />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('load', function () {
              var tries = 0;
              (function init() {
                if (window.SwaggerUIBundle) {
                  window.SwaggerUIBundle({ url: '/api/docs', dom_id: '#swagger-ui' });
                } else if (tries++ < 50) {
                  setTimeout(init, 100);
                }
              })();
            });
          `,
        }}
      />
    </div>
  );
}
