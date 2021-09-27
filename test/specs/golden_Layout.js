describe('Validate Golden Layout Application', () => {

    it('Should Launch The Golden Layout Application', function() {
        browser.url('/');
    })

    it('Should Load Standard Layout', function() {
        //browser.debug();
        const layoutDropdown = $('#layoutSelect');
        layoutDropdown.waitForExist(true);
        layoutDropdown.selectByVisibleText('standard');
        const loadLayoutButton = $('#loadLayoutButton');
        loadLayoutButton.waitForExist(true);
        loadLayoutButton.click();
    });

    it('Should Change The Color Of Lexicopr', function() {
        const lexiCorpTab = $("//div[@title='LexCorp plc.']");
        lexiCorpTab.click();
        const lexiCorpTextLabel = $("//p[normalize-space()='LexCorp plc. component']");
        expect(lexiCorpTextLabel.getText()).equals('LexCorp plc. component');
        const lexiCorpTextField = $("//div[6]//input[1]");
        lexiCorpTextField.clearValue()
        lexiCorpTextField.click();
        lexiCorpTextField.setValue('blue');

        const ele = $("//p[normalize-space()='LexCorp plc. component']").getCSSProperty('color');
        console.log(ele);
        // expect(ele).includes({color: blue});
        
    });

    it('Should Add A New Event Component', () => {
        const componentTypeDropdown = $('#registeredComponentTypesForAddSelect');
        componentTypeDropdown.selectByVisibleText('event');
        const addComponentButton = $('#addComponentButton');
        addComponentButton.click();
    });

    it('Should send An Event', () => {
        const eventTextBox = $("div:nth-child(12) input:nth-child(1)");
        eventTextBox.setValue('Test event 123');
        const sendEventButton = $("(//button[contains(text(),'SEND EVENT')])[2]");
        sendEventButton.click();
        const eventMessage = $("(//span[contains(text(),'Received: foo,Test event 123')])[2]");
        expect(eventMessage.getText()).includes('Test event 123');
    });

    it('Should Remove Components And Save Layout', () => {
        // highlight comp1 Event Component
        $("//body//section[@id='bodySection']//div[@class='lm_item lm_row']//div[@class='lm_item lm_row']//section[@class='lm_tabs']//div[2]").click();

        const compOneClose = $("//section[@class='lm_header lm_focused']//div[1]//div[1]");
        const compTwoClose = $("div[title='comp 2'] div[class='lm_close_tab']");
        const compThreeClose = $("div[title='comp 3'] div[class='lm_close_tab']");
        const saveLayoutButton= $("#saveLayoutButton");

        compTwoClose.click();
        compThreeClose.click();
        compOneClose.click();
        saveLayoutButton.click();

        //Asserting components are removed
        $("//p[normalize-space()='comp 1 component']").waitForExist({reverse: true});
        $("div[title='comp 2']").waitForExist({ reverse: true });
        $("div[title='comp 3']").waitForExist({ reverse: true });
    });

    it('Should Load Component Layout And Validate Components Are Not Present', () => {
        const layoutDropdown = $('#layoutSelect');
        layoutDropdown.selectByVisibleText('component');
        const loadLayoutButton = $('#loadLayoutButton');
        loadLayoutButton.click();
    });

    it('Should Restore Saved Layout And Send Event', () => {
        const restoreSavedLayoutButton = $("#reloadSavedLayoutButton");
        restoreSavedLayoutButton.click();
        const eventComponentTab = $("div[title='event'] span[class='lm_title']");
        eventComponentTab.click();
        $("(//input[@type='text'])[8]").setValue('Test event Maneesh');
        const sendEventButton = $("(//button[contains(text(),'SEND EVENT')])[2]");
        sendEventButton.click();
        const eventMessage = $("(//span[contains(text(),'Received: foo,Test event Maneesh')])[2]");
        expect(eventMessage.getText()).includes('Test event Maneesh');
    });

    it('Should Drag And Drop Comp1', () => {
        const sourceEle = $("div[title='comp 1']");
        const targetEle = $("div[title='LexCorp plc.']");
        sourceEle.dragAndDrop(targetEle);
    })
})