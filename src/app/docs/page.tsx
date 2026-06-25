import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Dokümantasyonu",
  robots: { index: false },
};

// Swagger UI — CDN'den yüklenir. TEDARİK ZİNCİRİ KORUMASI (O-3):
// sürüm SABİTLENİR + SRI (integrity) hash'i + crossorigin. unpkg ele geçirilse
// bile değiştirilmiş dosya hash uyuşmazlığından tarayıcıca reddedilir.
const SWAGGER_VERSION = "5.17.14";
const CSS_SRI = "sha384-wxLW6kwyHktdDGr6Pv1zgm/VGJh99lfUbzSn6HNHBENZlCN7W602k9VkGdxuFvPn";
const JS_SRI = "sha384-wmyclcVGX/WhUkdkATwhaK1X1JtiNrr2EoYJ+diV3vj4v6OC5yCeSu+yW13SYJep";

export default function ApiDocsPage() {
  return (
    <div>
      <link
        rel="stylesheet"
        href={`https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`}
        integrity={CSS_SRI}
        crossOrigin="anonymous"
      />
      <div id="swagger-ui" />
      <script
        src={`https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`}
        integrity={JS_SRI}
        crossOrigin="anonymous"
        async
      />
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
