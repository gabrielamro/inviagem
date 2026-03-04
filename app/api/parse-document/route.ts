import { NextRequest, NextResponse } from 'next/server';
const PDFParser = require("pdf2json");

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'O arquivo deve ser um PDF digital.' }, { status: 400 });
        }

        // Lê os bytes completos do arquivo carregado
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Usa o PDF2JSON para parsear o PDF para string
        const text: string = await new Promise((resolve, reject) => {
            const pdfParser = new PDFParser(null, 1);
            pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
            pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                resolve(pdfParser.getRawTextContent());
            });
            pdfParser.parseBuffer(buffer);
        });

        // Limpa o texto (remove quebras de linha e múltiplos espaços para facilitar o Regex)
        const cleanText = text.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\t/g, ' ').replace(/\s+/g, ' ').toUpperCase();

        console.log("================ DEBUG: CONTEÚDO BRUTO DO PDF ================");
        console.log(cleanText.substring(0, 5000));
        console.log("==============================================================");

        // Detecção de Tipo de Documento (Mais flexível e resiliente)
        // Priorizamos CRLV pois o texto do CRLV digital muitas vezes cita "CARTEIRA DIGITAL" ou "CNH" nas instruções/rodapé
        const isCRLV = cleanText.includes("CERTIFICADO") &&
            (cleanText.includes("VEICULO") || cleanText.includes("LICENCIAMENTO") || cleanText.includes("CRLV") || cleanText.includes("RENAVAM"));

        const isCNH = !isCRLV &&
            cleanText.includes("CARTEIRA") &&
            (cleanText.includes("NACIONAL") || cleanText.includes("HABILITACAO") || cleanText.includes("CNH"));

        const isCertidao = !isCRLV && !isCNH &&
            (cleanText.includes("CERTIDAO") || cleanText.includes("ANTECEDENTES") || cleanText.includes("DISTRIBUICAO")) &&
            (cleanText.includes("FEDERAL") || cleanText.includes("JUSTICA") || cleanText.includes("POLICIA"));

        if (isCRLV) {
            console.log("================ ANALISE CRLV ================");

            // 1. Placa (Suporta formato antigo ABC-1234 e Mercosul ABC1D23)
            const plateMatch = cleanText.match(/\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2})\b/) || cleanText.match(/\b([A-Z]{3}-[0-9]{4})\b/);
            const plate = plateMatch ? plateMatch[1].replace('-', '') : '';

            // 2. Marca / Modelo
            const brandMatch = cleanText.match(/\*{3}\s*([A-Z0-9.\-\/\s]+?)\s*PASSAGEIRO/);
            let brand = '', model = '';
            if (brandMatch && brandMatch[1]) {
                const rawBrandModel = brandMatch[1].trim().split('/');
                brand = rawBrandModel[0] ? rawBrandModel[0].trim().substring(0, 20) : 'AutoDetect';
                model = rawBrandModel[1] ? rawBrandModel[1].trim() : rawBrandModel[0]?.trim();
            }

            // 3. Ano de Fabricação (Busca padrão de anos 20XX ou 19XX próximos)
            const yearMatch = cleanText.match(/\b(20[0-2][0-9])\b/g);
            const year = yearMatch ? yearMatch[0] : ''; // Pega o primeiro ano encontrado (geralmente o de fabricação/modelo)

            // 4. Cor
            const colorList = ['BRANCA', 'PRETA', 'PRATA', 'CINZA', 'VERMELHA', 'AZUL', 'VERDE', 'AMARELA', 'MARROM', 'BEGE', 'BRANCO', 'PRETO'];
            const colorRegex = new RegExp(`\\b(${colorList.join('|')})\\b`);
            const colorMatch = cleanText.match(colorRegex);
            const color = colorMatch ? colorMatch[1] : '';

            // 5. Capacidade
            const capacityMatch = cleanText.match(/0([1-9])P/) || cleanText.match(/\b([1-9])\s*P\b/);
            const capacity = capacityMatch ? capacityMatch[1] : '5';

            return NextResponse.json({
                docType: 'CRLV',
                plate: plate || '',
                brand: brand || '',
                model: model || '',
                year: year || '',
                color: color || '',
                capacity: capacity || '5',
                message: 'Veículo identificado! Verifique e complete os dados abaixo.'
            });
        }

        if (isCNH) {
            console.log("================ ANALISE CNH ================");

            // EAR (Exerce Atividade Remunerada)
            const earRegex = /EXERCE\s+ATIVIDADE\s+REMUNERADA|EAR/i;
            const hasEAR = earRegex.test(cleanText);

            // Categoria
            const categoryMatch = cleanText.match(/CATEGORIA\s*([A-E]{1,2})/i) || cleanText.match(/\b([BCDE]{1}|AB|AC|AD|AE)\b/);
            const category = categoryMatch ? categoryMatch[1].toUpperCase().trim() : 'B';

            return NextResponse.json({
                docType: 'CNH',
                category,
                hasEAR: true,
                message: 'CNH Identificada com sucesso! Verifique os dados.'
            });
        }

        if (isCertidao) {
            console.log("================ ANALISE CERTIDÃO ================");

            const isNegative = cleanText.includes("NADA CONSTA") || cleanText.includes("NAO CONSTA") || cleanText.includes("NEGATIVA");
            const isPositive = cleanText.includes("CONSTA") && !cleanText.includes("NADA CONSTA") && !cleanText.includes("NAO CONSTA");

            // Se for negativa, ok (Verde). Se for positiva ou incerta (Amarelo), deixamos passar para análise humana
            return NextResponse.json({
                docType: 'CERTIDÃO',
                isNegative: isNegative,
                isPositive: isPositive, // Sinaliza pro front se quiser dar um alerta diferente
                isUncertain: !isNegative,
                message: isNegative ? 'Certidão Negativa validada com sucesso!' : 'Certidão recebida para auditoria manual.'
            });
        }

        // Se chegar aqui, o arquivo é um PDF mas a IA não deu 100% de certeza
        // Permitimos o anexo para não travar o usuário (Análise Manual)
        return NextResponse.json({
            docType: 'UNKNOWN',
            message: 'Documento recebido. Ele passará por auditoria manual do administrador.'
        });

    } catch (error: any) {
        console.error('Erro na extração de PDF:', error);
        return NextResponse.json({ error: 'Falha ao processar o arquivo PDF.', details: error.message }, { status: 500 });
    }
}
