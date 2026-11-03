import Link from 'next/link';
import { assetUrl } from '@/lib/api';
import { getArticleImage, getArticleTopic } from '@/lib/article-theme';
import { serverApi } from '@/lib/server-api';

export const dynamic = 'force-dynamic';

export default async function ArticlesPage({ searchParams }) {
  const params = await searchParams;
  const topic = Array.isArray(params.topic) ? params.topic[0] : params.topic;
  const page = Array.isArray(params.page) ? params.page[0] : params.page;
  const query = new URLSearchParams({ per_page: '12' });
  if (topic) query.set('topic', topic);
  if (page) query.set('page', page);
  const response = await serverApi(`/storefront/articles?${query.toString()}`);
  const result = response.data;
  const articles = result.data ?? [];
  const topics = response.topics ?? [];

  return (
    <main className="next-detail storefront-catalog mecha-articles">
      <Link href="/">← Về trang chủ</Link>
      <p className="mecha-eyebrow">GÓC XƯỞNG · BUILDER NOTES</p>
      <h1>Kiến thức lắp ráp & trưng bày</h1>
      <form action="/articles" className="storefront-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '20px 0' }}>
        <select name="topic" defaultValue={topic || ''} aria-label="Lọc chủ đề bài viết">
          <option value="">Tất cả chủ đề</option>
          {topics.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
        </select>
        <button type="submit" className="store-button">Lọc bài viết</button>
      </form>
      {articles.length ? (
        <div className="product-grid">
          {articles.map((article) => (
            <article key={article.id} className="product-card mecha-article-card">
              <Link href={`/articles/${article.slug}`} className="mecha-article-cover">
                <img src={assetUrl(getArticleImage(article.slug, article.image))} alt={`Ảnh chủ đề ${article.topic?.name || ''}`} />
                <span>LUANHUNG · BÀI VIẾT</span>
              </Link>
              <div className="product-card-content mecha-article-copy">
                <small>{getArticleTopic(article.slug, article.topic?.name)} · HƯỚNG DẪN</small>
                <h2><Link href={`/articles/${article.slug}`}>{article.title}</Link></h2>
                <p>{article.description}</p>
                <Link href={`/articles/${article.slug}`} className="mecha-article-read">Đọc bài viết →</Link>
              </div>
            </article>
          ))}
        </div>
      ) : <p>Chưa có bài viết nào trong chủ đề này.</p>}
      <nav className="next-pagination" aria-label="Phân trang bài viết">
        {result.current_page > 1
          ? <Link href={{ pathname: '/articles', query: { ...(topic ? { topic } : {}), page: String(result.current_page - 1) } }}>← Trước</Link>
          : <span aria-disabled="true">← Trước</span>}
        <span aria-current="page">{result.current_page} / {result.last_page}</span>
        {result.current_page < result.last_page
          ? <Link href={{ pathname: '/articles', query: { ...(topic ? { topic } : {}), page: String(result.current_page + 1) } }}>Sau →</Link>
          : <span aria-disabled="true">Sau →</span>}
      </nav>
    </main>
  );
}
