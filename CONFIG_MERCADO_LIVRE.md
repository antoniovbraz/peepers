# 🚀 Guia Rápido: Configuração Mercado Livre

## ⚠️ REQUISITO CRÍTICO: HTTPS

**O Mercado Livre EXIGE HTTPS para TODAS as operações:**

- ✅ URLs de redirecionamento OAuth
- ✅ URLs de webhook/notificações
- ✅ Todas as chamadas API

**❌ NÃO funciona com HTTP!**

---

## 📋 Checklist de Configuração (10 passos)

### 1. Pré-requisitos
- [ ] Conta **proprietária** no Mercado Livre (não operador)
- [ ] Domínio com **HTTPS** configurado
- [ ] Certificado SSL válido

### 2. Criar Aplicação
1. Acesse: https://developers.mercadolivre.com.br/
2. Clique "Criar uma aplicação"
3. Preencha os dados básicos

### 3. Configuração Técnica
4. **URLs de redirecionamento:**
   ```
   https://seudominio.com/api/auth/mercado-livre/callback
   ```

5. **Habilitar PKCE:** ✅ (obrigatório)

6. **Escopos:** Leitura e Escrita

7. **URL de notificações:**
   ```
   https://seudominio.com/api/webhook/mercado-livre
   ```

8. **Tópicos:**
   - [ ] orders_v2 (pedidos)
   - [ ] items (produtos)
   - [ ] messages (mensagens)

### 4. Variáveis de Ambiente
```bash
ML_CLIENT_ID=seu_app_id_aqui
ML_CLIENT_SECRET=seu_client_secret_aqui
NEXT_PUBLIC_APP_URL=https://seudominio.com
```

### 5. Testes
- [ ] Login OAuth funciona
- [ ] Webhooks recebem notificações
- [ ] API retorna dados

---

## 🚨 Erros Comuns e Soluções

### ❌ "redirect_uri mismatch"
**Causa:** URL no Mercado Livre diferente da configurada
**Solução:**
- Verifique se é exatamente igual
- Não use parâmetros variáveis
- Use HTTPS (não HTTP)

### ❌ "invalid_operator_user_id"
**Causa:** Conta operador tentando autorizar
**Solução:** Use conta de administrador/proprietário

### ❌ "PKCE verification failed"
**Causa:** PKCE não habilitado ou mal implementado
**Solução:**
- Habilite PKCE na aplicação
- Verifique implementação do code_challenge

### ❌ Webhook não funciona
**Causa:** URL HTTP ou resposta lenta
**Solução:**
- Use HTTPS
- Responda em até 5 segundos
- Retorne HTTP 200

---

## 🔧 Desenvolvimento Local

### Usando LocalTunnel (Recomendado)

```bash
# Instalar
npm install -g localtunnel

# Criar túnel HTTPS
npm run tunnel

# Resultado: https://xxxxx.loca.lt
```

### Configuração Temporária
1. Use a URL `https://xxxxx.loca.lt` gerada
2. Configure temporariamente no Mercado Livre
3. Teste a aplicação
4. **IMPORTANTE:** Configure URL de produção no final

---

## 🔐 Segurança e Limitações

### Rate Limits
- **1000 chamadas/hora** por aplicação
- **5000 chamadas/dia** por usuário
- Respeite os limites!

### Tokens
- **Expiração:** 6 meses
- **Renovação:** Automática via refresh_token
- **Revogação:** Possível pelo usuário

### Usuários
- ✅ Apenas administradores podem autorizar
- ❌ Operadores = erro `invalid_operator_user_id`
- ✅ Uma aplicação por conta proprietária

---

## 📞 Suporte

**Documentação Oficial:**
- https://developers.mercadolivre.com.br/

**DevCenter:**
- https://developers.mercadolivre.com.br/

**Comunidade:**
- Fóruns do Mercado Livre Developers

---

## ✅ Checklist Final

Após configurar tudo:

- [ ] Aplicação criada no DevCenter
- [ ] URLs HTTPS configuradas
- [ ] PKCE habilitado
- [ ] Escopos definidos
- [ ] Webhooks configurados
- [ ] Variáveis de ambiente setadas
- [ ] Testes passando
- [ ] Rate limits verificados

**🎉 Pronto! Sua integração está configurada corretamente.**</content>
<parameter name="filePath">c:\Users\anton\OneDrive\Documents\Cline\peepers\MERCADO_LIVRE_CONFIG.md