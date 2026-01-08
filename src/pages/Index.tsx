import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface CombinationEntry {
  id: number;
  numbers: number[];
  date: string;
}

const API_URL = 'https://functions.poehali.dev/a9690c9d-548f-48b5-8003-956e676bfdc4';

const Index = () => {
  const [combinations, setCombinations] = useState<CombinationEntry[]>([]);
  const [newNumbers, setNewNumbers] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCombinations();
    clearHistoryBeforeDate('2026-01-08');
  }, []);

  const loadCombinations = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setCombinations(data.combinations || []);
    } catch (error) {
      console.error('Error loading combinations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFrequency = () => {
    const frequency: { [key: number]: number } = {};
    for (let i = 1; i <= 45; i++) {
      frequency[i] = 0;
    }
    
    combinations.forEach(combo => {
      combo.numbers.forEach(num => {
        frequency[num]++;
      });
    });
    
    return frequency;
  };

  const frequency = calculateFrequency();

  const calculateLastAppearance = () => {
    const lastSeen: { [key: number]: number } = {};
    for (let i = 1; i <= 45; i++) {
      lastSeen[i] = -1;
    }
    
    combinations.forEach((combo, index) => {
      combo.numbers.forEach(num => {
        lastSeen[num] = index;
      });
    });
    
    return lastSeen;
  };

  const getPredictions = () => {
    const sorted = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([num]) => parseInt(num));
    
    return sorted;
  };

  const getProbabilityPredictions = () => {
    if (combinations.length === 0) return [];
    
    const lastSeen = calculateLastAppearance();
    const totalDraws = combinations.length;
    
    const probabilityScores = Object.entries(lastSeen).map(([num, lastIndex]) => {
      const numInt = parseInt(num);
      const drawsSinceLastSeen = lastIndex === -1 ? totalDraws : totalDraws - lastIndex - 1;
      const appearanceRate = frequency[numInt] / totalDraws;
      const expectedGap = appearanceRate > 0 ? 1 / appearanceRate : totalDraws;
      const deviationFromExpected = drawsSinceLastSeen - expectedGap;
      const probabilityScore = deviationFromExpected > 0 ? deviationFromExpected * (1 + appearanceRate) : 0;
      
      return {
        number: numInt,
        score: probabilityScore,
        drawsSince: drawsSinceLastSeen,
        frequency: frequency[numInt],
        expectedGap: Math.round(expectedGap)
      };
    });
    
    return probabilityScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  const predictions = getPredictions();
  const probabilityPredictions = getProbabilityPredictions();

  const addCombination = async () => {
    const nums = newNumbers.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 45);
    if (nums.length === 5) {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            numbers: nums,
            date: new Date().toISOString().split('T')[0]
          })
        });
        
        if (response.ok) {
          setNewNumbers('');
          await loadCombinations();
        }
      } catch (error) {
        console.error('Error adding combination:', error);
      }
    }
  };

  const clearHistory = async () => {
    if (confirm('Вы уверены, что хотите удалить всю историю комбинаций?')) {
      try {
        const response = await fetch(`${API_URL}?before_date=2100-01-01`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await loadCombinations();
        }
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  };

  const clearHistoryBeforeDate = async (beforeDate: string) => {
    try {
      const response = await fetch(`${API_URL}?before_date=${beforeDate}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadCombinations();
      }
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const getHeatColor = (count: number) => {
    const max = Math.max(...Object.values(frequency));
    const intensity = max > 0 ? count / max : 0;
    
    if (intensity > 0.7) return 'bg-primary text-primary-foreground';
    if (intensity > 0.4) return 'bg-primary/60 text-primary-foreground';
    if (intensity > 0.2) return 'bg-primary/30 text-primary';
    return 'bg-secondary text-secondary-foreground';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Анализатор комбинаций</h1>
          <p className="text-muted-foreground">Вычисление выигрышных чисел на основе статистики</p>
        </div>

        <Tabs defaultValue="predictions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <Icon name="Sparkles" size={16} />
              Результаты
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <Icon name="BarChart3" size={16} />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Icon name="TrendingUp" size={16} />
              Анализ
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Icon name="Clock" size={16} />
              История
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-6 animate-fade-in">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="TrendingUp" size={24} />
                  Прогноз по теории вероятности
                </CardTitle>
                <CardDescription>
                  Числа с наибольшей вероятностью выпадения (на основе отклонения от ожидаемой частоты)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 justify-center">
                  {probabilityPredictions.map((pred, index) => (
                    <div key={pred.number} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg hover:scale-110 transition-transform">
                        {pred.number}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {pred.drawsSince} тиражей назад
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        ожидается каждые ~{pred.expectedGap} тиражей
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-center text-muted-foreground">
                    <strong>Метод:</strong> Анализ отклонения от ожидаемой частоты выпадения с учётом истории
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Target" size={24} />
                  Топ по частоте выпадения
                </CardTitle>
                <CardDescription>
                  Топ-5 наиболее часто выпадающих чисел (классический метод)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 justify-center">
                  {predictions.map((num, index) => (
                    <div key={num} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg hover:scale-110 transition-transform">
                        {num}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {frequency[num]} раз
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-center text-muted-foreground">
                    Вероятность рассчитана на основе частоты появления чисел в истории
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="PieChart" size={24} />
                  Частота выпадения чисел
                </CardTitle>
                <CardDescription>
                  Визуализация статистики появления каждого числа
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-9 gap-2">
                  {Array.from({ length: 45 }, (_, i) => i + 1).map(num => (
                    <div
                      key={num}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-semibold transition-all hover:scale-110 ${getHeatColor(frequency[num])}`}
                    >
                      <span>{num}</span>
                      <span className="text-xs opacity-75">{frequency[num]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary"></div>
                    <span>Высокая частота</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary/60"></div>
                    <span>Средняя</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-secondary"></div>
                    <span>Низкая</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Award" size={20} />
                    Самые частые числа
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(frequency)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([num, count], index) => (
                        <div key={num} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <span className="font-semibold text-lg">{num}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-primary rounded-full" style={{ width: `${(count / Math.max(...Object.values(frequency))) * 100}px` }}></div>
                            <span className="text-sm text-muted-foreground">{count} раз</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="AlertCircle" size={20} />
                    Редкие числа
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(frequency)
                      .sort(([, a], [, b]) => a - b)
                      .slice(0, 10)
                      .map(([num, count], index) => (
                        <div key={num} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <span className="font-semibold text-lg">{num}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-muted rounded-full" style={{ width: `${count * 20}px` }}></div>
                            <span className="text-sm text-muted-foreground">{count} раз</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="List" size={24} />
                    История комбинаций
                  </div>
                  {combinations.length > 0 && (
                    <Button 
                      onClick={clearHistory} 
                      variant="destructive" 
                      size="sm"
                      className="gap-2"
                    >
                      <Icon name="Trash2" size={16} />
                      Очистить историю
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  Добавьте новую комбинацию для обновления статистики
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Введите 5 чисел через запятую (например: 7,14,23,31,42)"
                    value={newNumbers}
                    onChange={(e) => setNewNumbers(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCombination()}
                  />
                  <Button onClick={addCombination} className="gap-2">
                    <Icon name="Plus" size={16} />
                    Добавить
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {combinations.map((combo, index) => (
                    <div
                      key={combo.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{combo.date}</Badge>
                        <div className="flex gap-2">
                          {combo.numbers.map(num => (
                            <div
                              key={num}
                              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shadow-sm"
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;