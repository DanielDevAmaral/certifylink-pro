/**
 * Navigation utilities for handling document redirections from notifications
 */

export function navigateToRelatedDocument(
  documentType: 'certification' | 'technical_attestation' | 'legal_document' | 'badge',
  documentId: string
) {
  const baseUrls = {
    certification: '/certifications',
    technical_attestation: '/certificates', 
    legal_document: '/documents',
    badge: '/badges'
  };

  const targetUrl = `${baseUrls[documentType]}?highlight=${documentId}`;
  
  // Use window.location for navigation to ensure page reload and proper highlighting
  window.location.href = targetUrl;
}

/**
 * Get document ID from URL search params for highlighting
 */
export function getHighlightedDocumentId(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('highlight');
}

/**
 * Remove highlight parameter from URL
 */
export function clearHighlight() {
  const url = new URL(window.location.href);
  url.searchParams.delete('highlight');
  window.history.replaceState({}, '', url.toString());
}