import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { Customer } from '@shared/schema';

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Customer | null;
  onSaved?: () => void;
}

export default function EditClientDialog({ open, onOpenChange, client, onSaved }: EditClientDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: ''
  });

  // Atualizar o formulário quando o cliente selecionado mudar
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateClientMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!client) throw new Error('Cliente não selecionado');
      
      // Remover campos de senha se estiverem vazios
      const dataToSend: any = {...data};
      
      if (!data.password) {
        delete dataToSend.password;
        delete dataToSend.confirmPassword;
      }
      
      const res = await apiRequest('PATCH', `/api/customers/${client.id}`, dataToSend);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      onOpenChange(false);
      if (onSaved) onSaved();
      toast({
        title: 'Cliente atualizado',
        description: 'As informações do cliente foram atualizadas com sucesso.',
        variant: 'default',
      });
      
      // Limpar campos de senha
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar cliente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do cliente é obrigatório',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast({
        title: 'Erro de validação',
        description: 'Email inválido',
        variant: 'destructive',
      });
      return;
    }
    
    // Verificar se senhas coincidem caso tenham sido preenchidas
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro de validação',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }
    
    // Verificar comprimento mínimo da senha caso tenha sido preenchida
    if (formData.password && formData.password.length < 6) {
      toast({
        title: 'Erro de validação',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }
    
    updateClientMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Atualize as informações do cliente selecionado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cliente *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Digite o nome do cliente"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Digite o email do cliente"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="Digite o telefone do cliente"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              name="company"
              placeholder="Digite o nome da empresa"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
          
          <div className="pt-4">
            <h4 className="text-sm font-medium mb-2">Alterar Senha (opcional)</h4>
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Digite a nova senha"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirme a nova senha"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateClientMutation.isPending}>
              {updateClientMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
