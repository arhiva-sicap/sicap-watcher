import es from "@elastic/elasticsearch"
import dateFns from "date-fns"
import sgMail from "@sendgrid/mail"

const { subHours } = dateFns
const client = new es.Client({ node: process.env.ES_NODE })

export async function getAlerts() {
  const result = await client.search({
    index: "alerte",
    body: {
      query: {
        match_all: {},
      },
    },
  })

  const cuiMap = new Map()
  const emailMap = new Map()

  for (const hit of result.body.hits.hits) {
    emailMap.set(hit._id, hit._source.cui)
    for (const cui of hit._source.cui) {
      if (cuiMap.has(cui)) {
        cuiMap.set(cui, [...cuiMap.get(cui), hit._id])
      } else {
        cuiMap.set(cui, [hit._id])
      }
    }
  }

  return { cuiMap, emailMap }
}

export async function getContracts({ list, hours = 48 }) {
  const now = new Date()
  const past = subHours(now, hours)

  const resultAchizitii = await client.search({
    index: "achizitii-directe",
    body: {
      query: {
        bool: {
          filter: [
            {
              terms: {
                "supplier.numericFiscalNumber": list,
              },
            },
            {
              range: {
                "item.publicationDate": {
                  gte: past,
                  lte: now,
                  format: "strict_date_optional_time",
                },
              },
            },
          ],
        },
      },
    },
    _source: [
      "item.directAcquisitionId",
      "item.sysDirectAcquisitionState.text",
      "item.closingValue",
      "item.directAcquisitionName",
      "item.cpvCode",
      "item.publicationDate",
      "item.contractingAuthority",
      "item.uniqueIdentificationCode",
      "item.supplier",
      "supplier.numericFiscalNumber",
    ],
  })

  const achizitii = new Map()

  for (const hit of resultAchizitii.body.hits.hits) {
    const cui = hit._source.supplier.numericFiscalNumber

    if (achizitii.has(cui)) {
      achizitii.set(cui, [...achizitii.get(cui), hit._source.item])
    } else {
      achizitii.set(cui, [hit._source.item])
    }
  }

  const resultLicitatii = await client.search({
    index: "licitatii-publice",
    body: {
      query: {
        bool: {
          filter: [
            {
              terms: {
                "noticeContracts.items.winners.fiscalNumberInt": list,
              },
            },
            {
              range: {
                "item.noticeStateDate": {
                  gte: past,
                  lte: now,
                  format: "strict_date_optional_time",
                },
              },
            },
          ],
        },
      },
      _source: [
        "item.caNoticeId",
        "item.noticeNo",
        "item.sysProcedureState.text",
        "item.contractingAuthorityNameAndFN",
        "item.contractTitle",
        "item.sysProcedureType.text",
        "item.cpvCodeAndName",
        "item.ronContractValue",
        "item.noticeStateDate",
        "noticeContracts.items.winner.name",
        "noticeContracts.items.winner.fiscalNumberInt",
      ],
    },
  })

  const licitatii = new Map()

  for (const hit of resultLicitatii.body.hits.hits) {
    const winners = hit._source.noticeContracts.items.map((w) => w.winner.fiscalNumberInt)
    const cui = list.filter((cui) => winners.includes(Number(cui)))[0]

    if (licitatii.has(cui)) {
      licitatii.set(cui, [...licitatii.get(cui), hit._source])
    } else {
      licitatii.set(cui, [hit._source])
    }
  }

  return { achizitii, licitatii }
}

export async function existsLog({ email, id, type }) {
  const { body } = await client.exists({
    id: `${id}-${email}-${type}`,
    index: "alerte-log",
  })

  return body
}

export async function addLog({ email, id, type }) {
  await client.update({
    id: `${id}-${email}-${type}`,
    index: "alerte-log",
    body: {
      doc: {
        email,
        id,
        type,
        date: new Date(),
      },
      doc_as_upsert: true,
    },
  })
}

export async function addError({ email, error, contracts }) {
  await client.index({
    index: "alerte-log",
    body: {
      email,
      error,
      contracts,
      date: new Date(),
    },
  })
}

export function sendEmail(email, html) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)

  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: "Alerte SICAP",
    html,
  }

  return sgMail.send(msg)
}

export const moneyRon = (value) =>
  new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 0,
  }).format(value)
