import { BaseWindow, WebContentsView } from 'electron/main'
import { request } from 'node:https'


// copied and pasted from electron docs on webcontentsview
// https://www.electronjs.org/docs/latest/api/web-contents-view

const win = new BaseWindow({ width: 800, height: 400 })

const view1 = new WebContentsView()
win.contentView.addChildView( view1 )

// hardcoded, should have values extracted from database
// https://developer.ebay.com/api-docs/static/oauth-consent-request.html
// some parameters ommitted

// how to determine correct redirect, back to electron app? 
view1.webContents.loadURL(`https://auth.sandbox.ebay.com/oauth2/authorize?
    client_id=RandyLu-sand-SBX-e41907e53-a28e5f11& 
    prompt=login&                    
    redirect_uri=http://localhost:5173/&
    response_type=code&
    scope=<scopeList>&
    state=state
`)
view1.setBounds({ x: 0, y: 0, width: 900, height: 600 })

