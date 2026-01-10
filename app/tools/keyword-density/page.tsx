"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";

// Common English Stop Words
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
  "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
  "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
  "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
  "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
  "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
  "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
  "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
  "they've", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
  "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
  "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
  "yourself", "yourselves"
]);

interface KeywordData {
  phrase: string;
  count: number;
  density: number;
}

export default function KeywordDensityPage() {
  const [text, setText] = React.useState("");
  const [excludeStopWords, setExcludeStopWords] = React.useState(true);
  const [minWordLength, setMinWordLength] = React.useState(2); // eslint-disable-line @typescript-eslint/no-unused-vars
  
  const [stats, setStats] = React.useState({
    totalWords: 0,
    uniqueWords: 0,
    singleKeywords: [] as KeywordData[],
    twoWordPhrases: [] as KeywordData[],
    threeWordPhrases: [] as KeywordData[],
  });

  const analyzeText = React.useCallback(() => {
    if (!text.trim()) {
      setStats({
        totalWords: 0,
        uniqueWords: 0,
        singleKeywords: [],
        twoWordPhrases: [],
        threeWordPhrases: [],
      });
      return;
    }

    // 1. Clean and tokenize
    const words = text
      .toLowerCase()
      .replace(/[^\w\s']/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ");

    const validWords = words.filter(w => w.length >= 1);
    const totalCount = validWords.length;

    // 2. Process for keywords
    const filteredWords = validWords.filter(w => {
      if (w.length < minWordLength) return false;
      if (excludeStopWords && STOP_WORDS.has(w)) return false;
      return true;
    });

    const countFreq = (list: string[]) => {
      const counts: Record<string, number> = {};
      list.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
      });
      return counts;
    };

    // Single Keywords
    const singleCounts = countFreq(filteredWords);
    const singleKeywords: KeywordData[] = Object.entries(singleCounts)
      .map(([phrase, count]) => ({
        phrase,
        count,
        density: (count / totalCount) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Two-word Phrases
    const bigrams: string[] = [];
    for (let i = 0; i < filteredWords.length - 1; i++) {
      bigrams.push(`${filteredWords[i]} ${filteredWords[i+1]}`);
    }
    const bigramCounts = countFreq(bigrams);
    const twoWordPhrases: KeywordData[] = Object.entries(bigramCounts)
      .map(([phrase, count]) => ({
        phrase,
        count,
        density: (count / (totalCount - 1 || 1)) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Three-word Phrases
    const trigrams: string[] = [];
    for (let i = 0; i < filteredWords.length - 2; i++) {
      trigrams.push(`${filteredWords[i]} ${filteredWords[i+1]} ${filteredWords[i+2]}`);
    }
    const trigramCounts = countFreq(trigrams);
    const threeWordPhrases: KeywordData[] = Object.entries(trigramCounts)
      .map(([phrase, count]) => ({
        phrase,
        count,
        density: (count / (totalCount - 2 || 1)) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    setStats({
      totalWords: totalCount,
      uniqueWords: new Set(filteredWords).size,
      singleKeywords,
      twoWordPhrases,
      threeWordPhrases,
    });

  }, [text, excludeStopWords, minWordLength]);

  React.useEffect(() => {
    const timer = setTimeout(analyzeText, 500);
    return () => clearTimeout(timer);
  }, [analyzeText]);

  return (
    <ToolLayout
      title="Keyword Density Calculator"
      description="Analyze text content to find the most frequent keywords and phrases for SEO."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight">Content Input</h3>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text content here..."
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="exclude-stop" 
                    checked={excludeStopWords}
                    onChange={(e) => setExcludeStopWords(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="exclude-stop">Exclude Stop Words</Label>
                </div>
                <Button variant="outline" size="sm" onClick={() => setText("")}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Results Tabs */}
          <Tabs defaultValue="1-word">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1-word">One Word</TabsTrigger>
              <TabsTrigger value="2-word">Two Words</TabsTrigger>
              <TabsTrigger value="3-word">Three Words</TabsTrigger>
            </TabsList>
            
            {["1-word", "2-word", "3-word"].map((tab) => {
              let data: KeywordData[] = [];
              if (tab === "1-word") data = stats.singleKeywords;
              else if (tab === "2-word") data = stats.twoWordPhrases;
              else data = stats.threeWordPhrases;

              return (
                <TabsContent key={tab} value={tab}>
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-0">
                      <div className="w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                          <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Keyword</th>
                              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Count</th>
                              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Density</th>
                            </tr>
                          </thead>
                          <tbody className="[&_tr:last-child]:border-0">
                            {data.length === 0 ? (
                              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td colSpan={3} className="p-4 text-center text-muted-foreground h-24">
                                  No keywords found
                                </td>
                              </tr>
                            ) : (
                              data.map((k, i) => (
                                <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                  <td className="p-4 align-middle font-medium">{k.phrase}</td>
                                  <td className="p-4 align-middle text-right">{k.count}</td>
                                  <td className="p-4 align-middle text-right">{k.density.toFixed(2)}%</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        {/* Right Column: Summary Stats */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight">Statistics</h3>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Total Words</span>
                <span className="font-bold text-xl">{stats.totalWords}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Unique Keywords</span>
                <span className="font-bold text-xl">{stats.uniqueWords}</span>
              </div>
              <div className="space-y-2">
                 <Label>Settings</Label>
                 <div className="text-xs text-muted-foreground">
                    Min Word Length: {minWordLength} chars
                 </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight text-sm">SEO Tips</h3>
            </div>
            <div className="p-6 pt-0 text-sm text-muted-foreground space-y-2">
              <p>• <strong>Density:</strong> Aim for 1-2% for your main keywords. Stuffing keywords (&gt;3%) can be penalized.</p>
              <p>• <strong>Variety:</strong> Use synonyms and related phrases (LSI keywords).</p>
              <p>• <strong>Placement:</strong> Ensure keywords appear in the title, first paragraph, and headers.</p>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}