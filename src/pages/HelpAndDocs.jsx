import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, MessageCircle, Play, FileText, Search } from 'lucide-react';

const DOCS = [
  {
    category: 'Getting Started',
    items: [
      { title: 'Introduction to RICS Monitor', url: '#' },
      { title: 'Setting up your firm profile', url: '#' },
      { title: 'Inviting team members', url: '#' },
      { title: 'First case setup', url: '#' },
    ],
  },
  {
    category: 'Case Management',
    items: [
      { title: 'Creating a new case', url: '#' },
      { title: 'Managing incidents', url: '#' },
      { title: 'Uploading evidence', url: '#' },
      { title: 'Case narrative builder', url: '#' },
    ],
  },
  {
    category: 'RICS Compliance',
    items: [
      { title: 'RICS rules library', url: '#' },
      { title: 'Compliance assessment', url: '#' },
      { title: 'Breach reporting', url: '#' },
    ],
  },
];

const VIDEOS = [
  { title: 'Dashboard Overview', duration: '3:45' },
  { title: 'Creating Your First Case', duration: '8:20' },
  { title: 'Evidence Management Deep Dive', duration: '6:15' },
  { title: 'RICS Compliance Guide', duration: '12:30' },
];

export default function HelpAndDocs() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Help & Documentation</h1>
          <p className="text-slate-600 dark:text-slate-400">Everything you need to get the most from RICS Monitor</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="docs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="docs" className="gap-2">
              <FileText className="w-4 h-4" /> Documentation
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Play className="w-4 h-4" /> Video Tutorials
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <MessageCircle className="w-4 h-4" /> Support
            </TabsTrigger>
          </TabsList>

          {/* Documentation */}
          <TabsContent value="docs">
            <div className="space-y-6">
              {DOCS.map((section) => (
                <Card key={section.category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{section.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li key={item.title}>
                          <a
                            href={item.url}
                            className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <BookOpen className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-sm hover:underline">{item.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Video Tutorials */}
          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VIDEOS.map((video) => (
                <Card key={video.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="bg-slate-200 dark:bg-slate-800 aspect-video rounded-lg mb-4 flex items-center justify-center">
                      <Play className="w-12 h-12 text-slate-400" />
                    </div>
                    <p className="font-medium text-sm mb-1">{video.title}</p>
                    <p className="text-xs text-slate-500">{video.duration}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Support */}
          <TabsContent value="support">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Our support team is available Monday–Friday, 9am–5pm GMT.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Email</p>
                    <a href="mailto:support@ricsmonitor.com" className="text-primary hover:underline text-sm">
                      support@ricsmonitor.com
                    </a>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Phone</p>
                    <a href="tel:+441234567890" className="text-primary hover:underline text-sm">
                      +44 123 456 7890
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>FAQ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-sm mb-1">How do I export a case bundle?</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Navigate to Evidence &gt; Batch Export and select your evidence files.
                    </p>
                  </div>
                  <hr className="dark:border-slate-700" />
                  <div>
                    <p className="font-medium text-sm mb-1">Can I manage multiple firms?</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Yes, Enterprise users can manage multiple firm organizations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}