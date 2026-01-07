import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Mic, MicOff, Bot, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  transactionCreated?: boolean;
}

export default function WhatsApp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! 👋 Sou seu assistente financeiro. Você pode me enviar suas transações por texto ou áudio.\n\nExemplos:\n• \"Gastei 50 reais no supermercado\"\n• \"Recebi 3000 de salário\"\n• \"Paguei 150 de luz\"\n\nComo posso ajudar?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const utils = trpc.useUtils();
  const processMessageMutation = trpc.whatsapp.processMessage.useMutation({
    onSuccess: (data) => {
      let responseText = "";
      if (data.success && data.transaction) {
        const t = data.transaction;
        responseText = `✅ Transação registrada!\n\n` +
          `📝 ${t.description}\n` +
          `💰 R$ ${t.amount.toFixed(2)}\n` +
          `📁 ${t.category || 'Sem categoria'}\n` +
          `📅 ${t.date}`;
      } else {
        responseText = "Não consegui identificar uma transação na sua mensagem. Tente ser mais específico, por exemplo: \"Gastei 50 reais no mercado\"";
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
        transactionCreated: data.success,
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.success) {
        utils.transactions.list.invalidate();
        utils.transactions.getMonthlyStats.invalidate();
        utils.transactions.getCategoryStats.invalidate();
      }
    },
    onError: () => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Desculpe, não consegui processar sua mensagem. Tente novamente.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendText = () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    processMessageMutation.mutate({ message: inputText, messageType: "text" });
    setInputText("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        // For now, show a message that audio is being simulated
        const audioMessage: Message = {
          id: `audio-${Date.now()}`,
          role: "user",
          content: "🎤 [Áudio gravado]",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, audioMessage]);

        // Simulate audio processing with a placeholder message
        setIsProcessing(true);
        setTimeout(() => {
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: "🎤 Funcionalidade de áudio em desenvolvimento. Por enquanto, envie suas transações por texto!",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsProcessing(false);
        }, 1000);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Gravando... Clique novamente para parar");
    } catch {
      toast.error("Não foi possível acessar o microfone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assistente WhatsApp</h1>
        <p className="text-muted-foreground">Registre transações por texto ou áudio usando linguagem natural</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Interface */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="border-b bg-green-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-white">FinWise Bot</CardTitle>
                <CardDescription className="text-white/80">
                  {isProcessing ? "Digitando..." : "Online"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.role === "user"
                          ? "bg-green-600 text-white rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      <div className={`flex items-center gap-2 mt-1 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}>
                        <span className={`text-xs ${
                          message.role === "user" ? "text-white/70" : "text-muted-foreground"
                        }`}>
                          {formatTime(message.timestamp)}
                        </span>
                        {message.transactionCreated && (
                          <span className="text-xs text-green-500">✓ Registrado</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua transação..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isProcessing}
                  className="flex-1"
                />
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing && !isRecording}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={handleSendText}
                  disabled={!inputText.trim() || isProcessing}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Como usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-2">📝 Por texto:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• "Gastei 50 no mercado"</li>
                  <li>• "Paguei 200 de conta de luz"</li>
                  <li>• "Recebi 5000 de salário"</li>
                  <li>• "Almocei por 35 reais"</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">🎤 Por áudio:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Clique no microfone</li>
                  <li>• Fale sua transação</li>
                  <li>• Clique novamente para enviar</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Mencione o valor e a descrição</p>
              <p>• Use palavras como "gastei", "paguei" para despesas</p>
              <p>• Use "recebi", "ganhei" para receitas</p>
              <p>• A IA categoriza automaticamente</p>
              <p>• Você pode corrigir depois</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Integração Real</p>
                  <p className="text-sm text-green-700">
                    Em breve: conecte seu WhatsApp real para registrar transações diretamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
