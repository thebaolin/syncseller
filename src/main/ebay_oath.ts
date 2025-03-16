import { BaseWindow, WebContentsView } from 'electron/main'
import { request } from 'node:https'

// copied and pasted from electron docs on webcontentsview
// https://www.electronjs.org/docs/latest/api/web-contents-view

const win = new BaseWindow({ width: 900, height: 600 })

const view1 = new WebContentsView()
win.contentView.addChildView(view1)

// hardcoded, should have values extracted from database
// https://developer.ebay.com/api-docs/static/oauth-consent-request.html
// some parameters ommitted

// how to determine correct redirect, back to electron app?
view1.webContents.loadURL(`https://auth.sandbox.ebay.com/oauth2/authorize?
    client_id=Paulina_Chang-PaulinaC-syncse-mqstgd& 
    prompt=login&                    
    redirect_uri=PaulinaC-syncsell-SBX-d39433da4-724d7cb9&
    response_type=code&
    scope=%5Bhttps%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope%2Fsell.inventory.readonly%2C%20https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope%2Fsell.inventory%5D>&
    state=state
`)
view1.setBounds({ x: 0, y: 0, width: 900, height: 600 })
