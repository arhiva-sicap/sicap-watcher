### **sicap-watcher** sistem de alertare pe email atunci cand o companie are contracte noi adaugate in SICAP

# Functionare:

Atunci cand este exacutat, scriptul cauta in **achizitii-directe** si **licitatii-publice** din Elasticsearch toate contractele din ultimele 48 de ore filtrate dupa lista de coduri fiscale.

Lista companiilor urmarite se afla in indexul **alerte** si are documente cu urmatoarea structura:

```
{
  "_index" : "alerte",
  "_type" : "_doc",
  "_id" : "nume@email.com",
  "_score" : 1.0,
  "_source" : {
    "cui" : [
      "12345678",
      "7612464",
      "416103"
    ]
  }
```

**cui** reprezinta lista cu codurile fiscale urmarite, iar adresa de email este reprezentata ca si cheie unica de **\_id** -ul documentului.

Toate contractele noi gasite sunt compilate in template-ul html si trimise catre email-ul documentului.

Atunci cand un contract nou este gasit, va fi adaugat in **alerte-log** ca document cu urmatoarea structura:

```
{
  "_index" : "alerte-log",
  "_type" : "_doc",
  "_id" : "1233434-nume@email.com-achizitii",
  "_score" : 1.0,
  "_source" : {
    "email" : "nume@email.com",
    "id" : 1233434,
    "type" : "achizitii",
    "date" : "2020-08-17T14:18:59.059Z"
  }
},
```

Script-ul verifica intai daca un contract nou exista in **alerte-log**, pentru a nu fi trimis de doua ori.

# Instalare:

Creeaza index **alerte**, **alerte-log** si **alerte-errors** in Elasticsearch

Redenumeste fisierul .env.example in .env si completeaza ES_NODE cu adresa serverului de Elasticsearch, adresa de email si api key-ul de la Sendgrid pentru a putea trimite mesaje.

```bash
git clone git@github.com:sicap-ai/sicap-watcher.git
npm install
npm link
```

**.env**

```
export HOURS=48
export FROM_EMAIL=''
export ES_NODE=''
export SENDGRID_API_KEY=''
```

**Mod de utilizare:**
Inainte de a rula script-ul trebuie sa ai variabilele de mediu in memorie.

```bash
source .env
sicap-watcher
```

Script-ul se poate pune in crontab sa fie executat odata pe zi, dupa ce contractele din ziua respectiva sunt indexate in Elasticsearch.
