'use client';

import { useState } from 'react';
import { getAllTerms, getTermsByCategory, searchTerms, TERM_CATEGORIES, TermDefinition } from '@/lib/knowledge/definitions';

/**
 * TermsGlossaryPage Component
 *
 * Standalone page version of the Financial Terms glossary.
 * Always expanded with search and filters visible immediately.
 */
export default function TermsGlossaryPage() {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof TERM_CATEGORIES | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<TermDefinition | null>(null);

  const getFilteredTerms = () => {
    let terms = selectedCategory === 'all' ? getAllTerms() : getTermsByCategory(selectedCategory);

    if (searchQuery.trim()) {
      terms = searchTerms(searchQuery);
      // If a category is selected, filter search results by category
      if (selectedCategory !== 'all') {
        terms = terms.filter(t => t.category === selectedCategory);
      }
    }

    return terms.sort((a, b) => a.term.localeCompare(b.term));
  };

  const filteredTerms = getFilteredTerms();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'portfolio': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'fundamental': return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">📖</span>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Financial Terms & Definitions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Comprehensive glossary of trading and investment terminology
            </p>
          </div>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {filteredTerms.length} terms
        </span>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search terms, definitions, signals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 text-sm rounded-md transition-colors font-medium ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {Object.entries(TERM_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as keyof typeof TERM_CATEGORIES)}
                className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center space-x-1 font-medium ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {selectedTerm ? (
          /* Detailed Term View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{selectedTerm.icon}</span>
                <h3 className="text-2xl font-bold text-foreground">{selectedTerm.term}</h3>
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${getCategoryColor(selectedTerm.category)}`}>
                  {TERM_CATEGORIES[selectedTerm.category as keyof typeof TERM_CATEGORIES]?.label}
                </span>
              </div>
              <button
                onClick={() => setSelectedTerm(null)}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                ← Back to list
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span>📝</span> Definition
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedTerm.detailedDefinition}
                  </p>
                </div>

                {selectedTerm.formula && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <span>🔢</span> Formula
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <code className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                        {selectedTerm.formula}
                      </code>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span>💡</span> Interpretation
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedTerm.interpretation}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span>📊</span> Trading Signals
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedTerm.tradingSignals}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span>📖</span> Example
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-200 text-sm italic leading-relaxed">
                      {selectedTerm.example}
                    </p>
                  </div>
                </div>

                {selectedTerm.relatedTerms.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <span>🔗</span> Related Terms
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTerm.relatedTerms.map((relatedTerm) => (
                        <button
                          key={relatedTerm}
                          onClick={() => {
                            const allTerms = getAllTerms();
                            const term = allTerms.find(t => t.term.toLowerCase().includes(relatedTerm.toLowerCase()));
                            if (term) setSelectedTerm(term);
                          }}
                          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {relatedTerm}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Terms List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.map((term) => (
              <button
                key={term.term}
                onClick={() => setSelectedTerm(term)}
                className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">{term.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground text-sm mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {term.term}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {term.shortDefinition}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${getCategoryColor(term.category)}`}>
                      {TERM_CATEGORIES[term.category as keyof typeof TERM_CATEGORIES]?.label}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {filteredTerms.length === 0 && (
          <div className="text-center py-12">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-gray-500 dark:text-gray-400 text-lg">No terms found matching your search</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try a different search term or category</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
