'use client';

import { useState } from 'react';
import { getAllTerms, getTermsByCategory, searchTerms, TERM_CATEGORIES, TermDefinition } from '@/lib/knowledge/definitions';

interface TermsGlossaryProps {
  className?: string;
}

export default function TermsGlossary({ className = '' }: TermsGlossaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof TERM_CATEGORIES | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<TermDefinition | null>(null);

  const getFilteredTerms = () => {
    let terms = selectedCategory === 'all' ? getAllTerms() : getTermsByCategory(selectedCategory);
    
    if (searchQuery.trim()) {
      terms = searchTerms(searchQuery);
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
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">📖</span>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Financial Terms & Definitions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click any underlined term above or explore the complete glossary
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{filteredTerms.length} terms</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground text-sm"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
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
                    className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center space-x-1 ${
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

          {/* Terms Grid */}
          <div className="p-6">
            {selectedTerm ? (
              /* Detailed Term View */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{selectedTerm.icon}</span>
                    <h3 className="text-xl font-semibold text-foreground">{selectedTerm.term}</h3>
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${getCategoryColor(selectedTerm.category)}`}>
                      {TERM_CATEGORIES[selectedTerm.category as keyof typeof TERM_CATEGORIES]?.label}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTerm(null)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ← Back to list
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Definition</h4>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedTerm.detailedDefinition}
                      </p>
                    </div>

                    {selectedTerm.formula && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Formula</h4>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                          <code className="text-sm text-gray-800 dark:text-gray-200">
                            {selectedTerm.formula}
                          </code>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-foreground mb-2">Interpretation</h4>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedTerm.interpretation}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Trading Signals</h4>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedTerm.tradingSignals}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-2">Example</h4>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                        <p className="text-blue-800 dark:text-blue-200 text-sm italic leading-relaxed">
                          {selectedTerm.example}
                        </p>
                      </div>
                    </div>

                    {selectedTerm.relatedTerms.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Related Terms</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTerm.relatedTerms.map((relatedTerm) => (
                            <button
                              key={relatedTerm}
                              onClick={() => {
                                const term = filteredTerms.find(t => t.term.includes(relatedTerm));
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
                    className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg flex-shrink-0">{term.icon}</span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground text-sm mb-1 truncate">
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
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">🔍</span>
                <p className="text-gray-500 dark:text-gray-400">No terms found matching your search</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}