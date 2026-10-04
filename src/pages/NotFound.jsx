import useDocumentMeta from '../lib/useDocumentMeta.js';
import { Link } from '../lib/router.jsx';
import { ArrowIcon } from '../components/icons.jsx';
import './pages.css';

export default function NotFound() {
  useDocumentMeta({ title: 'Not found' });
  return (
    <div className="subpage notfound">
      <div className="wrap">
        <p className="eyebrow">
          <b>404</b>
          <span aria-hidden="true">—</span>
          Missing data point
        </p>
        <h1 className="display">
          This page is an <em>outlier.</em>
        </h1>
        <p className="lede">It may have moved, or it was never here.</p>
        <Link href="/" className="text-btn text-btn--solid">
          <ArrowIcon size={14} direction="left" /> Back home
        </Link>
      </div>
    </div>
  );
}
