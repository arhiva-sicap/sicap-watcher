import { moneyRon } from "./lib.js"

const contractAchizitii2Mjml = ({
  publicationDate,
  uniqueIdentificationCode,
  sysDirectAcquisitionState,
  closingValue,
  contractingAuthority,
  cpvCode,
  directAcquisitionName,
  directAcquisitionId,
}) => `
  <mj-text color="#525252" font-size="14px">
    ${publicationDate} | ${uniqueIdentificationCode} | ${sysDirectAcquisitionState.text} | ${moneyRon(closingValue)} RON
  </mj-text>
  <mj-text color="#525252" font-size="14px">
    ${contractingAuthority}
  </mj-text>
  <mj-text color="#525252" font-size="14px">
    ${cpvCode}
  </mj-text>
  <mj-text color="#525252" font-size="14px">
    ${directAcquisitionName}
  </mj-text>
  <mj-button font-size="14px" href="https://e-licitatie.ro/pub/direct-acquisition/view/${directAcquisitionId}" background-color="#fafafa" color="blue" align="left" padding="0">
    e-licitatie.ro/pub/direct-acquisition/view/${directAcquisitionId}
  </mj-button>
  <mj-divider border-width="1px" border-color="lightgrey" />
`

const contractLicitatii2Mjml = ({
  noticeStateDate,
  noticeNo,
  sysProcedureType,
  sysProcedureState,
  ronContractValue,
  contractingAuthorityNameAndFN,
  cpvCodeAndName,
  contractTitle,
  caNoticeId,
}) => `
  <mj-text color="#525252" font-size="14px">
    ${noticeStateDate} | ${noticeNo} | ${sysProcedureType.text} | ${sysProcedureState.text} | ${moneyRon(
  ronContractValue
)}
  </mj-text>
  <mj-text color="#525252" font-size="14px">
    ${contractingAuthorityNameAndFN}
  </mj-text>
  <mj-text color="#525252" font-size="14px">
    ${cpvCodeAndName}
  </mj-text>
  <mj-text color="#525252" font-size="14px">
    ${contractTitle}
  </mj-text>
  <mj-button font-size="14px" href="https://e-licitatie.ro/pub/notices/ca-notices/view-c/${caNoticeId}" background-color="#fafafa" color="blue" align="left" padding="0">
    e-licitatie.ro/pub/notices/ca-notices/view-c/${caNoticeId}
  </mj-button>
  <mj-divider border-width="1px" border-color="lightgrey" />
`

export function emailTemplate(achizitii, licitatii) {
  let achizitiiMjml = ""
  let licitatiiMjml = ""

  for (const [, contracts] of achizitii) {
    achizitiiMjml += `
    <mj-text color="#525252" font-weight="bold" font-size="14px" line-height="20px">
      ${contracts[0].supplier}
    </mj-text>
    `
    for (const contract of contracts) {
      achizitiiMjml += contractAchizitii2Mjml(contract)
    }
  }

  for (const [cui, contracts] of licitatii) {
    const company = contracts[0].noticeContracts.items.find((c) => c.winner.fiscalNumberInt === Number(cui))
    licitatiiMjml += `
    <mj-text color="#525252" font-weight="bold" font-size="14px" line-height="20px">
      ${cui} ${company.winner.name}
    </mj-text>`

    for (const contract of contracts) {
      licitatiiMjml += contractLicitatii2Mjml(contract.item)
    }
  }

  const achizitiiTpl = achizitiiMjml
    ? `
      <mj-text font-size="16px" color="#626262">Achizitii directe</mj-text>
      <mj-divider border-width="3px" border-color="lightgrey" />
      ${achizitiiMjml}`
    : ""

  const licitatiiTpl = licitatiiMjml
    ? `
      <mj-text font-size="16px" color="#626262">Licitatii publice</mj-text>
      <mj-divider border-width="3px" border-color="lightgrey" />
      ${licitatiiMjml}`
    : ""

  return `
  <mjml>
  <mj-body>
    <mj-section background-color="#fafafa">
      <mj-column width="600px">
        ${achizitiiTpl}
        ${licitatiiTpl}
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
  `
}
