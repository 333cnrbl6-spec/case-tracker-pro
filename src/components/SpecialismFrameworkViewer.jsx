import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAllSpecialisms,
  getAllCategories,
  getAllRegulatoryBodies,
  getSpecialismById,
} from '@/lib/ukLawSpecialisms';
import {
  Scale,
  Building2,
  Search,
  ChevronRight,
  FileText,
  Shield,
  Users,
} from 'lucide-react';

export default function SpecialismFrameworkViewer() {
  const [selectedSpecialism, setSelectedSpecialism] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const allSpecialisms = getAllSpecialisms();
  const allCategories = getAllCategories();
  const regulatoryBodies = getAllRegulatoryBodies();

  const filtered = allSpecialisms.filter((spec) => {
    const matchSearch =
      !searchTerm ||
      spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      selectedCategory === 'all' || spec.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const specDetails = selectedSpecialism
    ? getSpecialismById(selectedSpecialism)
    : null;

  return (
    <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Scale className="w-8 h-8" />
          UK Law Specialisms Framework
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Comprehensive coverage of UK legal practice areas with professional standards,
          regulatory bodies, and statutory frameworks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Specialism List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Specialisms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search specialisms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Specialism List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filtered.map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedSpecialism(spec.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedSpecialism === spec.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary'
                    }`}
                  >
                    <p className="font-medium text-sm">{spec.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {spec.description}
                    </p>
                    <Badge className="mt-2 text-xs" variant="outline">
                      {spec.category}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Specialism Details */}
        <div className="lg:col-span-2 space-y-4">
          {specDetails ? (
            <>
              {/* Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    {specDetails.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    {specDetails.description}
                  </p>
                  <Badge className="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                    {specDetails.category}
                  </Badge>
                </CardContent>
              </Card>

              {/* Governing Framework */}
              {specDetails.governing_framework && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Governing Framework
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {specDetails.governing_framework.map((law, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm"
                        >
                          <span className="text-primary font-bold">•</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {law}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Regulatory Bodies & Professional Bodies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specDetails.regulatory_bodies && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Regulatory Bodies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {specDetails.regulatory_bodies.map((body, idx) => (
                          <div
                            key={idx}
                            className="text-sm font-medium text-slate-700 dark:text-slate-300 p-2 bg-slate-100 dark:bg-slate-800 rounded"
                          >
                            {body}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {specDetails.professional_bodies && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Professional Bodies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {specDetails.professional_bodies.map((body, idx) => (
                          <div
                            key={idx}
                            className="text-sm font-medium text-slate-700 dark:text-slate-300 p-2 bg-slate-100 dark:bg-slate-800 rounded"
                          >
                            {body}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Essential Elements */}
              {specDetails.essential_elements && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Essential Legal Elements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(specDetails.essential_elements).map(
                      ([key, element]) => (
                        <div
                          key={key}
                          className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-800"
                        >
                          <p className="font-medium text-sm">
                            {element.description}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {element.guidance}
                          </p>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Critical Checkpoints */}
              {specDetails.critical_checkpoints && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      ✓ Critical Checkpoints
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {specDetails.critical_checkpoints.map((checkpoint, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-green-600 font-bold mt-0.5">✓</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {checkpoint}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Government Guidance */}
              {specDetails.government_guidance && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Government Guidance:</strong>{' '}
                      {specDetails.government_guidance}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="h-full flex items-center justify-center py-12">
              <div className="text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">
                  Select a specialism to view details
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Regulatory Bodies Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Key UK Regulatory Bodies & Professional Organisations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {regulatoryBodies.slice(0, 15).map((body) => (
              <div
                key={body.id}
                className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-800"
              >
                <p className="font-medium text-sm">{body.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {body.type}
                </p>
                {body.website && (
                  <p className="text-xs text-primary mt-2 truncate">
                    {body.website}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}