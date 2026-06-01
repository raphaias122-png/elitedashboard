(function() {
    // Função para aguardar o iframe estar disponível
    function waitForIframe(callback, maxAttempts = 50) {
        let attempts = 0;

        function checkIframe() {
            const iframe = document.getElementById('offerIframe');

            if (iframe) {
                callback(iframe);
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkIframe, 100);
            }
        }

        checkIframe();
    }

    waitForIframe(function(iframe) {
        let iframeUrl = iframe.src;

        if (window.location.protocol === 'https:' && iframeUrl.startsWith('http://')) {
            iframeUrl = iframeUrl.replace('http://', 'https://');
            console.log('Convertendo URL para HTTPS:', iframeUrl);
        }

        if (iframeUrl && iframeUrl !== '{offer}' && iframeUrl.trim() !== '') {
            iframe.src = iframeUrl;
            console.log('Iframe carregado com URL:', iframeUrl);
        } else {
            console.warn('Aviso: iframe sem URL válida');
        }
    });
})();
