
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generates a multi-page PDF from a DOM element by capturing it with html2canvas
 * and splitting the resulting image across multiple A4 pages if necessary.
 */
export const generateMultiPagePDF = async (
    element: HTMLElement,
    filename: string,
    onProgress?: (progress: number) => void
) => {
    try {
        const canvas = await html2canvas(element, {
            scale: 2.5, // High resolution for text clarity
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10; // 10mm margin
        const contentWidth = pageWidth - (margin * 2);

        // Calculate the height of the content on the PDF page
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = contentWidth / imgWidth;
        const totalContentHeightInPdf = imgHeight * ratio;

        let heightLeft = totalContentHeightInPdf;
        let position = margin; // Start with margin at the top

        // Add the first page
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, totalContentHeightInPdf);
        heightLeft -= (pageHeight - margin * 2);

        // Add additional pages if content overflows
        while (heightLeft > 0) {
            position = heightLeft - totalContentHeightInPdf + margin;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, totalContentHeightInPdf);
            heightLeft -= (pageHeight - margin * 2);
        }

        pdf.save(filename);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw error;
    }
};
