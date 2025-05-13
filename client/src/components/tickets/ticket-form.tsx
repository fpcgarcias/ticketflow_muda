import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { insertTicketSchema, type InsertTicket } from '@shared/schema';
import { TICKET_TYPES, PRIORITY_LEVELS, DEPARTMENTS } from '@/lib/utils';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

// Definir tipos para os dados buscados
interface Customer {
  id: number;
  name: string;
  email: string;
}

interface IncidentType {
  id: number;
  name: string;
  value: string;
  departmentId: number;
}

interface Department {
  id: number;
  name: string;
}

export const TicketForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Adicionar uma consulta para buscar os clientes
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Garantir que customers é um array
  const customers = Array.isArray(customersData) ? customersData : [];

  const form = useForm<InsertTicket & { customerId?: number }>({
    resolver: zodResolver(insertTicketSchema.extend({
      customerId: z.number().optional()
    })),
    defaultValues: {
      title: '',
      description: '',
      customerEmail: '',
      customerId: undefined,
      type: '',
      priority: 'medium' as const,
      departmentId: undefined,
      incidentTypeId: undefined,
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: InsertTicket) => {
      const response = await apiRequest('POST', '/api/tickets', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Chamado criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/user-role'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      navigate('/tickets');
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar o chamado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTicket & { customerId?: number }) => {
    // Se um cliente foi selecionado, usar seu email
    if (data.customerId) {
      // Usar 'customers' que é garantido como array
      const selectedCustomer = customers.find((c: Customer) => c.id === data.customerId);
      if (selectedCustomer) {
        data.customerEmail = selectedCustomer.email;
      }
    }
    
    // Remover customerId que não faz parte do schema
    const { customerId, ...ticketData } = data;
    createTicketMutation.mutate(ticketData);
  };

  // Buscar dados de departamentos
  const { data: departmentsData } = useQuery<Department[]>({
    queryKey: ["/api/settings/departments"],
    initialData: DEPARTMENTS.map(dept => ({ id: parseInt(dept.value), name: dept.label }))
  });

  // Garantir que departments é um array
  const departments = Array.isArray(departmentsData) ? departmentsData : [];

  // Buscar dados de tipos de incidentes
  const { data: incidentTypesData } = useQuery<IncidentType[]>({
    queryKey: ["/api/settings/incident-types"],
  });

  // Garantir que incidentTypes é um array
  const incidentTypes = Array.isArray(incidentTypesData) ? incidentTypesData : [];

  // Filtrar tipos de incidentes pelo departamento selecionado
  const selectedDepartmentId = form.watch('departmentId');
  const filteredIncidentTypes = selectedDepartmentId 
    ? incidentTypes.filter((type: IncidentType) => type.departmentId === selectedDepartmentId)
    : incidentTypes;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-medium mb-2">Criar Novo Chamado</h2>
        <p className="text-neutral-600 mb-6">Adicione um novo chamado de suporte</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const customerId = parseInt(value);
                        field.onChange(customerId);
                        
                        // Atualizar automaticamente o email
                        // Usar 'customers' que é garantido como array
                        const selectedCustomer = customers.find((c: Customer) => c.id === customerId);
                        if (selectedCustomer) {
                          form.setValue('customerEmail', selectedCustomer.email);
                        }
                      }}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer: Customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        // Atualizar o departamento selecionado
                        const departmentId = parseInt(value);
                        field.onChange(departmentId);
                        
                        // Limpar o tipo de incidente quando o departamento muda
                        form.setValue('type', '');
                        form.setValue('incidentTypeId', undefined);
                      }} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um departamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept: Department) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Chamado</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        
                        // Encontrar o tipo de incidente pelo valor selecionado
                        // Usar 'incidentTypes' que é garantido como array
                        const selectedType = incidentTypes.find((type: IncidentType) => type.value === value);
                        if (selectedType) {
                          // Atualizar o ID do tipo de incidente
                          form.setValue('incidentTypeId', selectedType.id);
                          
                          // Se o departamento não estiver selecionado, selecionar automaticamente
                          // baseado no tipo de incidente
                          if (!form.getValues('departmentId') && selectedType.departmentId) {
                            form.setValue('departmentId', selectedType.departmentId);
                          }
                        }
                      }} 
                      defaultValue={field.value}
                      disabled={!selectedDepartmentId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedDepartmentId ? "Escolha o tipo" : "Selecione um departamento primeiro"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredIncidentTypes.map((type: IncidentType) => (
                          <SelectItem key={type.id} value={type.value}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PRIORITY_LEVELS.LOW}>Baixa</SelectItem>
                        <SelectItem value={PRIORITY_LEVELS.MEDIUM}>Média</SelectItem>
                        <SelectItem value={PRIORITY_LEVELS.HIGH}>Alta</SelectItem>
                        <SelectItem value={PRIORITY_LEVELS.CRITICAL}>Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Chamado</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título do chamado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Problema</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o problema detalhadamente..." 
                      rows={6} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="px-6"
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? "Criando..." : "Enviar Chamado"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
