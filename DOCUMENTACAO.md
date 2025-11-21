# Documentação Completa - Ferramenta de Clone de Páginas

## 1. Visão Geral

A ferramenta de clone de páginas é uma aplicação web completa que permite aos usuários clonar, editar e baixar páginas web de forma simples e intuitiva. A plataforma oferece recursos avançados de edição visual, gerenciamento de recursos e sistema de créditos para controle de uso.

### Objetivo Principal
Permitir que usuários façam cópias perfeitas de páginas web em segundos, com total controle sobre edição e personalização, podendo baixar o resultado como HTML puro ou ZIP com todos os arquivos organizados.

---

## 2. Funcionalidades Principais

### 2.1 Clonagem de Páginas

#### Como Funciona
- **Entrada de URL**: Usuário insere a URL da página que deseja clonar
- **Processamento**: Sistema busca o HTML através de múltiplos proxies CORS para contornar restrições
- **Extração de Recursos**: Identifica e cataloga todos os recursos da página (CSS, JS, imagens)
- **Resolução de URLs**: Converte URLs relativas em absolutas baseadas na URL original

#### Proxies Utilizados
1. `https://api.allorigins.win/raw?url=`
2. `https://corsproxy.io/?`

Sistema tenta cada proxy em sequência até obter sucesso.

#### Opções Avançadas
- **Headers Customizados**: Permite adicionar headers HTTP personalizados para contornar proteções
- **Templates de Headers**: Sistema de templates reutilizáveis com variáveis dinâmicas
- **Embedding Base64**: Opção para incorporar imagens e CSS diretamente no HTML usando data URIs

### 2.2 Processamento de Recursos

#### Tipos de Recursos Extraídos
- **CSS**: Folhas de estilo externas e inline
- **JavaScript**: Scripts externos e inline
- **Imagens**: PNG, JPG, SVG, WEBP, GIF
- **Fontes**: WOFF, WOFF2, TTF, OTF
- **Ícones**: Favicon e ícones de app

#### Sistema de Cache (IndexedDB)
- Armazena recursos baixados localmente
- Evita downloads duplicados
- Melhora performance em clonagens subsequentes
- Gerenciamento automático de timestamps

### 2.3 Editor Visual

#### Funcionalidades do Editor
1. **Seleção de Elementos**
   - Hover com destaque visual
   - Click para seleção
   - Navegação pela árvore DOM

2. **Edição de Texto**
   - Edição inline de conteúdo textual
   - Preservação de formatação HTML
   - Preview em tempo real

3. **Edição de Estilos**
   - Painel de estilos com controles visuais
   - Edição de:
     - Cores (background e texto)
     - Tipografia (fonte, tamanho, peso)
     - Espaçamento (padding e margin)
   - Color picker integrado
   - Aplicação instantânea de mudanças

4. **Edição de Links**
   - Modificação de URLs
   - Alteração de texto do link
   - Configuração de target (_blank, _self, etc.)

5. **Gerenciamento de Elementos**
   - Deleção de elementos
   - Visualização em árvore DOM
   - Navegação hierárquica

6. **Histórico de Edições**
   - Undo (Ctrl/Cmd + Z)
   - Redo (Ctrl/Cmd + Shift + Z)
   - Até 50 estados salvos
   - Debounce de 500ms para otimização

7. **Preview Responsivo**
   - Modos: Desktop, Tablet, Mobile
   - Larguras: 1920px, 768px, 375px
   - Alternância rápida entre viewports

### 2.4 Opções de Download

#### 1. HTML Puro
- Arquivo `.html` único
- Recursos referenciados por URLs absolutas
- Pronto para uso imediato
- Custo: 1 crédito

#### 2. ZIP Completo
- Estrutura organizada de arquivos:
  ```
  cloned-page/
  ├── index.html
  ├── css/
  │   └── (arquivos CSS)
  ├── js/
  │   └── (arquivos JavaScript)
  ├── images/
  │   └── (imagens)
  └── fonts/
      └── (fontes)
  ```
- Todos os recursos baixados e organizados
- URLs atualizadas para caminhos relativos
- Totalmente standalone
- Custo: 3 créditos
- Progresso de download em tempo real

#### 3. Copiar HTML
- Copia HTML para clipboard
- Sem custo de créditos
- Ideal para testes rápidos

### 2.5 Gerenciamento de Páginas Clonadas

#### Salvamento de Páginas
- Armazenamento no banco de dados
- Geração automática de slug único
- Extração de título da página
- Metadados:
  - URL original
  - Data de criação
  - Última atualização
  - Contador de visualizações
  - Status público/privado

#### Dashboard
- Lista todas as páginas clonadas
- Estatísticas:
  - Total de páginas
  - Total de visualizações
  - Páginas públicas
- Busca e filtros
- Ações por página:
  - Visualizar
  - Copiar link público
  - Deletar

#### Páginas Públicas
- URL amigável: `/{slug}`
- Contador de visualizações automático
- Renderização em iframe isolado
- Configuração de privacidade

---

## 3. Sistema de Autenticação

### 3.1 Recursos de Autenticação
- **Registro de Usuários**: Email e senha
- **Login**: Autenticação por email/senha
- **Auto-confirm Email**: Emails confirmados automaticamente (desenvolvimento)
- **Persistência de Sessão**: LocalStorage com refresh automático
- **Logout**: Limpeza completa de sessão

### 3.2 Proteção de Rotas
- Rotas públicas: `/`, `/auth`, `/{slug}`, `/404`
- Rotas protegidas: `/dashboard`, `/templates`, `/transactions`, `/admin`, `/buy-credits`
- Redirecionamento automático para login

### 3.3 Perfil de Usuário
Armazenado na tabela `profiles`:
- Nome
- Email
- WhatsApp (opcional)
- Data de criação
- Última atualização

---

## 4. Sistema de Créditos

### 4.1 Modelo de Créditos

#### Custos por Ação
| Ação | Custo |
|------|-------|
| Clonar página | 1 crédito |
| Download HTML | 1 crédito |
| Download ZIP | 3 créditos |
| Salvar página | 1 crédito |
| Editar visualmente | Grátis |
| Copiar HTML | Grátis |

### 4.2 Gerenciamento de Créditos
- Saldo exibido em tempo real
- Verificação antes de cada ação
- Bloqueio de ações sem créditos suficientes
- Prompt para compra quando necessário

### 4.3 Transações
Tabela `credit_transactions` registra:
- Tipo de ação (`action_type`)
- Quantidade de créditos (`amount`: positivo para compra, negativo para uso)
- Descrição
- Data e hora
- ID do usuário

### 4.4 Histórico de Transações
- Página dedicada: `/transactions`
- Lista completa de todas as transações
- Filtros e ordenação
- Tipos de transação identificados por cores

---

## 5. Sistema de Pagamentos (Asaas)

### 5.1 Integração Asaas

#### Edge Function: `create-asaas-payment`
Cria cobranças no Asaas:
- **Input**:
  ```typescript
  {
    credits: number,
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX',
    customer: {
      name: string,
      email: string,
      cpfCnpj: string,
      phone?: string
    },
    creditCard?: { ... }
  }
  ```
- **Output**:
  ```typescript
  {
    paymentId: string,
    invoiceUrl: string,
    bankSlipUrl?: string,
    creditCardTransaction?: { ... },
    pixQrCode?: { ... }
  }
  ```

#### Webhooks: `asaas-webhook`
Processa notificações de pagamento:
- Verifica assinatura HMAC-SHA256
- Eventos suportados:
  - `PAYMENT_CONFIRMED`
  - `PAYMENT_RECEIVED`
- Atualiza créditos do usuário automaticamente
- Registra transação no histórico
- Segurança: Rejeita webhooks não autenticados

### 5.2 Pacotes de Créditos
Configurados em `admin_settings`:
```json
{
  "10": { "price": 10, "credits": 10 },
  "20": { "price": 18, "credits": 20 },
  "50": { "price": 40, "credits": 50 },
  "100": { "price": 70, "credits": 100 }
}
```

### 5.3 Página de Compra
- Interface intuitiva
- Seleção de pacote
- Múltiplos métodos de pagamento:
  - Cartão de crédito
  - Boleto
  - PIX
- Formulário de dados do cliente
- Validação em tempo real
- Redirecionamento para pagamento

---

## 6. Gerenciamento de Templates de Headers

### 6.1 Funcionalidades

#### Criação de Templates
- Nome do template
- Categoria (e-commerce, social, etc.)
- Descrição
- Headers em formato JSON
- Instruções de uso
- Variáveis dinâmicas
- Status público/privado

#### Sistema de Variáveis
Templates podem conter variáveis como:
- `{{user_agent}}`
- `{{token}}`
- `{{api_key}}`

Usuário preenche valores ao usar o template.

#### Compartilhamento
- Templates públicos visíveis para todos
- Templates privados apenas para o criador
- Biblioteca de templates comunitária

### 6.2 Casos de Uso
- Bypass de proteções anti-bot
- Autenticação em APIs
- Headers personalizados por site
- Reutilização de configurações complexas

---

## 7. Sistema Administrativo

### 7.1 Painel Admin (`/admin`)

#### Gestão de Configurações
- Preços de pacotes de créditos
- Configurações gerais do sistema
- Parâmetros de operação

#### Controle de Acesso
- Role-based: `admin` | `user`
- Tabela `user_roles`
- Função RLS: `has_role()`

### 7.2 Configurações do Sistema
Tabela `admin_settings`:
- Chave-valor flexível (JSONB)
- Versionamento por `updated_at`
- Descrições para documentação

---

## 8. Arquitetura Técnica

### 8.1 Stack Tecnológico

#### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Roteamento**: React Router DOM v6
- **State Management**: React Hooks + Context
- **UI Components**: Radix UI + shadcn/ui
- **Formulários**: React Hook Form + Zod
- **Notificações**: Sonner (toasts)
- **Ícones**: Lucide React

#### Backend (Lovable Cloud/Supabase)
- **Database**: PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Functions**: Deno Edge Functions
- **Real-time**: Supabase Realtime (opcional)

### 8.2 Estrutura de Dados

#### Tabelas Principais

**profiles**
```sql
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- name (text)
- email (text)
- whatsapp (text, nullable)
- created_at, updated_at (timestamptz)
```

**user_credits**
```sql
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- credits (integer, default 0)
- created_at, updated_at (timestamptz)
```

**credit_transactions**
```sql
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- amount (integer) -- positivo = compra, negativo = uso
- action_type (text) -- 'purchase', 'clone', 'download', etc.
- description (text, nullable)
- created_at (timestamptz)
```

**cloned_pages**
```sql
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- title (text)
- slug (text, unique)
- original_url (text)
- html_content (text)
- is_public (boolean, default false)
- views_count (integer, default 0)
- thumbnail_url (text, nullable)
- created_at, updated_at (timestamptz)
```

**header_templates**
```sql
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- name (text)
- category (text, nullable)
- description (text, nullable)
- headers (jsonb)
- variables (text[], nullable)
- instructions (text, nullable)
- is_public (boolean, default false)
- created_at, updated_at (timestamptz)
```

**admin_settings**
```sql
- id (uuid, PK)
- key (text, unique)
- value (jsonb)
- description (text, nullable)
- created_at, updated_at (timestamptz)
```

**user_roles**
```sql
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- role (enum: 'admin', 'user')
- created_at (timestamptz)
```

### 8.3 Segurança (RLS Policies)

#### Row Level Security Habilitado
Todas as tabelas possuem RLS ativado com políticas específicas:

**profiles**
- Leitura: Pública (todos podem ver perfis)
- Inserção: Apenas próprio usuário
- Atualização: Apenas próprio usuário

**user_credits**
- Leitura: Apenas próprio usuário
- Inserção: Sistema (via trigger)
- Atualização: Sistema (via trigger)

**credit_transactions**
- Leitura: Apenas próprio usuário
- Inserção: Sistema
- Atualização: Bloqueado

**cloned_pages**
- Leitura: Próprio usuário OU páginas públicas
- Inserção: Usuário autenticado
- Atualização: Apenas próprio usuário
- Deleção: Apenas próprio usuário

**header_templates**
- Leitura: Próprio usuário OU templates públicos
- Inserção: Usuário autenticado
- Atualização: Apenas próprio usuário
- Deleção: Apenas próprio usuário

**admin_settings**
- Leitura: Bloqueado (acesso via API)
- Escrita: Apenas admins

### 8.4 Edge Functions

#### create-asaas-payment
- **Método**: POST
- **Autenticação**: Bearer token (Supabase Auth)
- **Rate Limiting**: Configurável
- **Validação**: Zod schemas
- **Timeout**: 30s

#### asaas-webhook
- **Método**: POST
- **Autenticação**: HMAC signature verification
- **Idempotência**: Verifica se pagamento já foi processado
- **Retry**: Suporte a retries do Asaas

### 8.5 Componentes Frontend

#### Estrutura de Componentes

**Páginas**
- `Index.tsx`: Landing page
- `Auth.tsx`: Login/Registro
- `Dashboard.tsx`: Painel principal
- `Templates.tsx`: Gerenciamento de templates
- `Transactions.tsx`: Histórico de transações
- `BuyCredits.tsx`: Compra de créditos
- `Admin.tsx`: Painel administrativo
- `PublicPage.tsx`: Visualização de páginas públicas
- `NotFound.tsx`: Página 404

**Componentes Principais**
- `CloneForm.tsx`: Formulário de clonagem (450+ linhas)
- `VisualEditor.tsx`: Editor visual completo
- `CreditBalance.tsx`: Exibição de saldo
- `CreditPurchaseModal.tsx`: Modal de compra
- `HeaderTemplateManager.tsx`: Gerenciamento de templates

**Componentes do Editor**
- `EditorToolbar.tsx`: Barra de ferramentas
- `StylePanel.tsx`: Painel de estilos
- `TextEditor.tsx`: Editor de texto
- `LinkEditor.tsx`: Editor de links
- `DOMTree.tsx`: Visualização em árvore
- `ElementSelector.tsx`: Seletor de elementos
- `ResponsivePreview.tsx`: Preview responsivo
- `ColorPicker.tsx`: Seletor de cores

**Hooks Customizados**
- `useAuth.tsx`: Gerenciamento de autenticação
- `useCredits.tsx`: Gerenciamento de créditos
- `useElementSelection.tsx`: Seleção de elementos
- `useStyleEditor.tsx`: Edição de estilos
- `useEditorHistory.tsx`: Histórico de edições

**Utilitários**
- `zipCreator.ts`: Criação de arquivos ZIP
- `resourceExtractor.ts`: Extração de recursos
- `base64Embedder.ts`: Embedding de recursos
- `resourceCache.ts`: Cache IndexedDB
- `slugGenerator.ts`: Geração de slugs
- `editorUtils.ts`: Utilidades do editor

---

## 9. Fluxos de Usuário

### 9.1 Fluxo de Clonagem Básica

1. Usuário acessa `/` (landing page)
2. Insere URL da página alvo
3. (Opcional) Configura headers customizados
4. (Opcional) Habilita embedding Base64
5. Clica em "Clonar Página" (1 crédito)
6. Sistema processa e exibe preview
7. Opções disponíveis:
   - Baixar HTML (1 crédito)
   - Baixar ZIP (3 créditos)
   - Editar visualmente (grátis)
   - Copiar HTML (grátis)
   - Salvar página (1 crédito)

### 9.2 Fluxo de Edição Visual

1. Após clonar, clica em "Editar Visualmente"
2. Editor carrega em modo iframe
3. Usuário pode:
   - Selecionar elementos clicando
   - Editar textos inline
   - Modificar estilos no painel
   - Editar links
   - Deletar elementos
   - Visualizar árvore DOM
   - Alternar entre viewports
4. Edições aplicadas em tempo real
5. Clica em "Salvar Edição"
6. Retorna ao preview atualizado

### 9.3 Fluxo de Compra de Créditos

1. Usuário identifica saldo insuficiente
2. Clica em "Comprar Créditos"
3. Seleciona pacote desejado
4. Escolhe método de pagamento
5. Preenche dados do cliente
6. Confirma compra
7. Sistema cria cobrança no Asaas
8. Usuário completa pagamento
9. Webhook confirma pagamento
10. Créditos adicionados automaticamente
11. Notificação de sucesso

### 9.4 Fluxo de Template de Headers

1. Usuário acessa `/templates`
2. Cria novo template ou seleciona existente
3. Define headers e variáveis
4. Salva template
5. Ao clonar página, seleciona template
6. Preenche valores das variáveis
7. Template aplicado à requisição

---

## 10. Boas Práticas e Limitações

### 10.1 Limitações Conhecidas

#### Técnicas
- Páginas com proteção anti-scraping avançada podem falhar
- JavaScript executado no cliente não é capturado
- Conteúdo carregado dinamicamente (AJAX) não é incluído
- Limite de tamanho de recursos (dependente do proxy)
- CORS pode bloquear alguns recursos

#### Legais
- Respeitar direitos autorais e propriedade intelectual
- Não clonar conteúdo protegido sem permissão
- Uso responsável conforme termos de serviço dos sites

### 10.2 Otimizações Implementadas

#### Performance
- Cache IndexedDB para recursos
- Debounce em histórico de edições
- Lazy loading de componentes
- Compressão de ZIP assíncrona
- Batch de requisições ao banco

#### UX
- Feedback visual em tempo real
- Loading states apropriados
- Mensagens de erro claras
- Toasts informativos
- Validação de formulários

#### Segurança
- RLS em todas as tabelas
- Verificação de assinatura de webhooks
- Sanitização de inputs
- Tokens JWT para autenticação
- CORS configurado adequadamente

---

## 11. Configuração e Deployment

### 11.1 Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

### 11.2 Secrets (Edge Functions)

- `ASAAS_API_KEY`: Chave API do Asaas
- `ASAAS_WEBHOOK_SECRET`: Secret para validação de webhooks
- `SUPABASE_SERVICE_ROLE_KEY`: Auto-configurado

### 11.3 Configuração Asaas

1. Criar conta no Asaas
2. Obter API Key
3. Configurar webhook URL
4. Gerar webhook secret
5. Adicionar secrets no projeto

### 11.4 Build e Deploy

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview de produção
npm run preview
```

Edge Functions são deployadas automaticamente via Lovable Cloud.

---

## 12. Manutenção e Monitoramento

### 12.1 Logs e Debugging

#### Frontend
- Console logs para debugging
- Error boundaries
- Sentry (opcional)

#### Backend
- Edge Function logs no Supabase
- Webhook logs detalhados
- Transaction tracking

### 12.2 Métricas Importantes

- Taxa de sucesso de clonagem
- Uso de créditos por usuário
- Conversão de compras
- Erros de pagamento
- Performance de proxies

### 12.3 Backup e Recuperação

- Backup automático do Supabase
- Versionamento de código (Git)
- Snapshots de configurações
- Política de retenção de dados

---

## 13. Roadmap e Melhorias Futuras

### 13.1 Funcionalidades Planejadas

- [ ] Suporte a mais formatos de export (PDF, MHTML)
- [ ] Editor de CSS avançado
- [ ] Preview antes da clonagem
- [ ] Comparação de versões
- [ ] Agendamento de clonagens
- [ ] API pública para integração
- [ ] Aplicativo mobile
- [ ] Temas dark/light
- [ ] Colaboração em tempo real
- [ ] Importação de ZIP existente

### 13.2 Melhorias Técnicas

- [ ] Implementar CDN para recursos estáticos
- [ ] Cache Redis para melhor performance
- [ ] Queue system para processos pesados
- [ ] Análise de SEO da página clonada
- [ ] Compressão automática de imagens
- [ ] Minificação de CSS/JS
- [ ] Suporte a WebP e formatos modernos

---

## 14. Suporte e Documentação

### 14.1 Recursos de Ajuda

- **Documentação**: Este arquivo
- **Tutorial interativo**: Na landing page
- **FAQs**: Seção de perguntas frequentes
- **Suporte**: Email ou chat (configurar)

### 14.2 Troubleshooting Comum

**Clonagem falhando**
- Verificar se URL é válida
- Testar com headers customizados
- Verificar proteções do site alvo

**Créditos não atualizando**
- Verificar webhook configurado
- Checar logs de pagamento
- Confirmar status no Asaas

**Editor não carregando**
- Limpar cache do navegador
- Verificar console por erros
- Recarregar página

---

## 15. Licença e Termos

### 15.1 Uso Responsável

Esta ferramenta deve ser usada de forma ética e legal:
- Respeitar robots.txt
- Não sobrecarregar servidores alvo
- Respeitar propriedade intelectual
- Obter permissão quando necessário
- Uso educacional e de desenvolvimento

### 15.2 Disclaimer

A ferramenta é fornecida "como está", sem garantias. O uso é de responsabilidade do usuário, devendo estar em conformidade com leis aplicáveis e termos de serviço dos sites clonados.

---

**Versão**: 1.0.0  
**Última Atualização**: 2024  
**Mantido por**: Equipe de Desenvolvimento
