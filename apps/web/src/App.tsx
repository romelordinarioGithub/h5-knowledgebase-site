import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CatalogPage } from './components/CatalogPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkipLink } from './components/SkipLink';

const DocPage = lazy(() =>
  import('./pages/DocPage').then((module) => ({ default: module.DocPage }))
);

function DocFallback() {
  return (
    <div className="mx-auto mt-16 w-[min(840px,92vw)]">
      <div className="skeleton h-64 w-full rounded-[18px]" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/h5-knowledgebase-site">
      <SkipLink />
      <ErrorBoundary label="Application">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/browse" element={<CatalogPage />} />
          <Route path="/browse/:category" element={<CatalogPage />} />
          <Route
            path="/doc/:id"
            element={
              <Suspense fallback={<DocFallback />}>
                <DocPage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
