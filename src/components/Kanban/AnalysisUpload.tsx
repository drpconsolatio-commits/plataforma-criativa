"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Paperclip, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './AnalysisUpload.module.css';

interface AnalysisUploadProps {
  onAnalysisComplete: (data: any) => void;
}

export default function AnalysisUpload({ onAnalysisComplete }: AnalysisUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'analyzing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();

      reader.onload = async (evt) => {
        setIsUploading(true);
        setStatus('parsing');
        setErrorMsg('');

        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          if (!data || data.length === 0) {
            setErrorMsg("A planilha está vazia.");
            setStatus('error');
            setIsUploading(false);
            return;
          }

          const transformedData = data.map((row: any) => {
            // Normalizador de chaves para evitar problemas com espaços ou case
            const getVal = (keys: string[]) => {
              for (const k of keys) {
                const found = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
                if (found) return row[found];
              }
              return 0;
            };

            const getName = (keys: string[]) => {
              for (const k of keys) {
                const found = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
                if (found) return row[found];
              }
              return "Sem Nome";
            };

            // Mapeamento Técnico Novo com multiplicador de porcentagem (ex: 0.18 -> 18.0)
            const hookRate = parseFloat(String(getVal(['hook_rate', 'tsr', 'thumb stop rate']))) * 100;
            const holdRate = parseFloat(String(getVal(['hold_rate', 'retenção', 'retenção média']))) * 100;
            const ctaRate = parseFloat(String(getVal(['cta_rate', 'impacto', 'outbound ctr']))) * 100;
            const spend = parseFloat(String(getVal(['spend', 'valor gasto', 'valor', 'spent'])));
            const roas = parseFloat(String(getVal(['roas', 'retorno'])));
            const cpr = parseFloat(String(getVal(['cpr', 'cost per registration', 'custo por registro'])));
            const cps = parseFloat(String(getVal(['cps', 'cost per sale', 'custo por venda'])));
            const cpl = parseFloat(String(getVal(['cpl', 'cost per lead', 'custo por lead'])));
            const alc = parseInt(String(getVal(['alcance', 'reach']))) || 0;
            const imp = parseInt(String(getVal(['impressões', 'impressoes', 'impressions']))) || 0;
            const adName = getName(['nome_anuncio', 'criativo', 'nome do anúncio', 'ad name']);

            return {
              ...row,
              'Criativo': adName,
              'TSR': hookRate,
              'Retenção': holdRate,
              'Impacto': ctaRate,
              'Valor gasto': spend,
              'ROAS': roas,
              'CPR': cpr,
              'CPS': cps,
              'CPL': cpl,
              'Alcance': alc,
              'Impressões': imp,
              'Nome da campanha': getName(['nome_campanha', 'campanha', 'campaign']),
              'Nome do conjunto de anúncios': getName(['nome_conjunto', 'conjunto', 'ad set']),
            };
          });

          setStatus('analyzing');

          const response = await fetch('/api/analyze-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spreadsheetData: transformedData }),
          });

          const resultData = await response.json();

          if (!response.ok) {
            setErrorMsg(resultData.error || "Erro de API");
            setStatus('error');
            return;
          }

          setStatus('done');
          
          // Capturar o nome da campanha do primeiro registro do CSV
          const detectedCampaignName = transformedData[0]?.['Nome da campanha'] || 
                                     transformedData[0]?.['Nome do conjunto de anúncios'] || 
                                     null;
          
          onAnalysisComplete({ ...resultData, detectedCampaignName });
          
          setTimeout(() => {
            setStatus('idle');
            setIsUploading(false);
          }, 2000);

        } catch (err: any) {
          console.error("-> [Frontend] Erro Silencioso:", err.message);
          setErrorMsg("Erro ao processar dados.");
          setStatus('error');
        } finally {
          setIsUploading(false);
        }
      };

      reader.readAsBinaryString(file);

    } catch (err: any) {
      console.error("-> [Frontend] Erro ao ler arquivo:", err);
      setErrorMsg("Erro ao ler o arquivo.");
      setStatus('error');
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <label className={`${styles.uploadBtn} ${isUploading ? styles.disabled : ''}`}>
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileUpload} 
          disabled={isUploading}
          hidden
        />
        
        {status === 'idle' && (
          <Paperclip size={14} />
        )}

        {(status === 'parsing' || status === 'analyzing') && (
          <>
            <Loader2 size={14} className={styles.spin} />
            <span>{status === 'parsing' ? 'Lendo...' : 'IA analisando...'}</span>
          </>
        )}

        {status === 'done' && (
          <>
            <CheckCircle2 size={14} className={styles.successIcon} />
            <span>Concluído!</span>
          </>
        )}

        {status === 'error' && (
          <div className={styles.errorContainer}>
            <AlertCircle size={14} className={styles.errorIcon} />
            <div className={styles.errorPopover}>
              {errorMsg}
            </div>
          </div>
        )}
      </label>
    </div>
  );
}
