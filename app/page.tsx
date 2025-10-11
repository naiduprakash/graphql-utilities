'use client';

import { Header } from '@/components/layout/Header';
import { NotificationContainer } from '@/components/layout/NotificationContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Zap, ArrowRight, Plus } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            GraphQL Utilities
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A comprehensive suite of tools to help you work with GraphQL schemas, queries, and operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Query Generation Card */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-lg bg-blue-500 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Query Generation
                </h3>
                <p className="text-gray-600 mb-4">
                  Generate GraphQL queries, mutations, and fragments from your schema
                </p>
                <Button
                  onClick={() => window.location.href = '/query-generation'}
                  className="flex items-center space-x-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Skeleton Cards */}
          {[1, 2, 3, 4, 5].map((index) => (
            <Card key={index} className="p-6 border-2 border-dashed border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-gray-200 animate-pulse">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-600 mb-6">
              Start with our Query Generation tool to create GraphQL operations from your schema.
            </p>
            <Button
              onClick={() => window.location.href = '/query-generation'}
              className="flex items-center space-x-2 mx-auto"
            >
              <Zap className="h-5 w-5" />
              <span>Launch Query Generation</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <NotificationContainer />
    </div>
  );
}
