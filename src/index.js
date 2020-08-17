#!/usr/bin/env node
import mjml2html from "mjml"

import { getAlerts, getContracts, sendEmail, addLog, existsLog, addError } from "./lib.js"
import { emailTemplate } from "./template.js"

async function run() {
  const { cuiMap, emailMap } = await getAlerts()
  const list = Array.from(cuiMap.keys())
  const { achizitii, licitatii } = await getContracts({ list, hours: process.env.HOURS })

  for (const [email, list] of emailMap) {
    const tmpAchizitii = new Map()
    const tmpLicitatii = new Map()

    for (const cui of list) {
      if (achizitii.has(cui)) {
        const achizitiiFiltered = await filterAchizitii(achizitii, cui, email)
        if (achizitiiFiltered.length > 0) {
          tmpAchizitii.set(cui, achizitiiFiltered)
        }
      }

      if (licitatii.has(cui)) {
        const licitatiiFiltered = await filterLicitatii(licitatii, cui, email)
        if (licitatiiFiltered.length > 0) {
          tmpLicitatii.set(cui, licitatiiFiltered)
        }
      }
    }

    if (tmpAchizitii.size === 0 && tmpLicitatii.size === 0) continue

    const mjmlTemplate = emailTemplate(tmpAchizitii, tmpLicitatii)
    const { html } = mjml2html(mjmlTemplate, { minify: true })

    await sendEmail(email, html)
      .then(async () => {
        for (const [, contracts] of tmpAchizitii) {
          for (const { directAcquisitionId: id } of contracts) {
            await addLog({ email, id, type: "achizitii" })
          }
        }
        for (const [, contracts] of tmpLicitatii) {
          for (const {
            item: { caNoticeId: id },
          } of contracts) {
            await addLog({ email, id, type: "licitatii" })
          }
        }
      })
      .catch((error) => addError({ email, error, contracts: { achizitii: tmpAchizitii, licitatii: tmpLicitatii } }))
  }
}

async function filterAchizitii(achizitii, cui, email) {
  const ids = achizitii.get(cui).map((contract) => contract.directAcquisitionId)
  const logged = []

  for (const id of ids) {
    const exists = await existsLog({ email, id, type: "achizitii" })

    if (exists) {
      logged.push(id)
    }
  }

  return achizitii.get(cui).filter((contract) => !logged.includes(contract.directAcquisitionId))
}

async function filterLicitatii(licitatii, cui, email) {
  const ids = licitatii.get(cui).map((contract) => contract.item.caNoticeId)
  const logged = []

  for (const id of ids) {
    const exists = await existsLog({ email, id, type: "licitatii" })

    if (exists) {
      logged.push(id)
    }
  }

  return licitatii.get(cui).filter((contract) => !logged.includes(contract.item.caNoticeId))
}

run()
