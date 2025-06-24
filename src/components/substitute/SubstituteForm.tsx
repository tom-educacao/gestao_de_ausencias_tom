import React, { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { supabase } from '../../lib/supabase';
import { Building, User } from 'lucide-react';

export default function SubstituteForm() {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState("");

  // Função para validar se o nome contém apenas letras
  const validateName = (name: string) => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    return nameRegex.test(name);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permite apenas letras e espaços
    if (value === '' || validateName(value)) {
      setName(value);
      setError("");
    } else {
      setError("O nome deve conter apenas letras");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validações
    if (!name.trim()) {
      setError("Nome é obrigatório");
      setLoading(false);
      return;
    }

    if (!validateName(name.trim())) {
      setError("O nome deve conter apenas letras");
      setLoading(false);
      return;
    }

    if (!unit) {
      setError("Unidade é obrigatória");
      setLoading(false);
      return;
    }

    try {
      // Inserir na tabela substitutes
      const { error: substituteError } = await supabase
        .from("substitutes")
        .insert([
          { 
            name: name.trim(),
            unit: unit,
            active: true
          },
        ]);

      if (substituteError) {
        console.error("Erro ao cadastrar substituto:", substituteError.message);
        setError("Erro ao cadastrar substituto. Tente novamente.");
      } else {
        // Sucesso
        setShowSuccessModal(true);

        // Limpar os campos após o sucesso
        setName("");
        setUnit("");
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Card title="Cadastro de Substitutos">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome do Substituto"
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Digite o nome completo"
            required
            icon={<User size={18} className="text-gray-400" />}
          />

          <Select
            label="Unidade"
            id="unit"
            name="unit"
            value={unit}
            onChange={(value) => setUnit(value)}
            options={[
              { value: 'ANTONIO T R DE OLIVEIRA, C E-EF M', label: 'ANTONIO T R DE OLIVEIRA, C E-EF M' },
              { value: 'NILO CAIRO, C E-EF M N PROFIS', label: 'NILO CAIRO, C E-EF M N PROFIS' },
              { value: 'UNIDADE POLO, C E-EF M PROFIS', label: 'UNIDADE POLO, C E-EF M PROFIS' },
              { value: 'LEOCADIA B RAMOS, C E-EF M PROFIS', label: 'LEOCADIA B RAMOS, C E-EF M PROFIS' },
              { value: 'MATHIAS JACOMEL, C E-EF M PROFIS', label: 'MATHIAS JACOMEL, C E-EF M PROFIS' },
              { value: 'ANIBAL KHURY NETO, C E-EF M PROFIS', label: 'ANIBAL KHURY NETO, C E-EF M PROFIS' },
              { value: 'ELIAS ABRAHAO, C E PROF-EF M PROFIS', label: 'ELIAS ABRAHAO, C E PROF-EF M PROFIS' },
              { value: 'HILDEBRANDO DE ARAUJO, C E-EF M PROFIS', label: 'HILDEBRANDO DE ARAUJO, C E-EF M PROFIS' },
              { value: 'NATALIA REGINATO, C E-EF M PROFIS', label: 'NATALIA REGINATO, C E-EF M PROFIS' },
              { value: 'OLIVIO BELICH, C E DEP-EF M', label: 'OLIVIO BELICH, C E DEP-EF M' },
              { value: 'AYRTON SENNA DA SILVA, C E-EF M N PROFIS', label: 'AYRTON SENNA DA SILVA, C E-EF M N PROFIS' },
              { value: 'GUSTAVO D DA SILVA, C E-EF M PROFIS', label: 'GUSTAVO D DA SILVA, C E-EF M PROFIS' },
              { value: 'JUSCELINO K DE OLIVEIRA, C E-EFMPN', label: 'JUSCELINO K DE OLIVEIRA, C E-EFMPN' },
              { value: 'TAMANDARE, C E ALM-EF M PROFIS', label: 'TAMANDARE, C E ALM-EF M PROFIS' },
              { value: 'RUI BARBOSA, C E C-EF M', label: 'RUI BARBOSA, C E C-EF M' },
              { value: 'BELO HORIZONTE, C E-EF M PROFIS', label: 'BELO HORIZONTE, C E-EF M PROFIS' },
              { value: 'DURVAL RAMOS FILHO, C E-EF M PROFIS', label: 'DURVAL RAMOS FILHO, C E-EF M PROFIS' },
              { value: 'GERALDO FERNANDES, C E D-EF M', label: 'GERALDO FERNANDES, C E D-EF M' },
              { value: 'JARDIM SAN RAFAEL, C E DO-EF M', label: 'JARDIM SAN RAFAEL, C E DO-EF M' },
              { value: 'KAZUCO OHARA, E E PROF-EF', label: 'KAZUCO OHARA, E E PROF-EF' },
              { value: 'NOSSA SRA LOURDES, C E-EF M', label: 'NOSSA SRA LOURDES, C E-EF M' },
              { value: 'UBEDULHA C OLIVEIRA, C E PROFA-EF M P N', label: 'UBEDULHA C OLIVEIRA, C E PROFA-EF M P N' },
              { value: 'WILLIE DAVIDS, C E DR-EF M', label: 'WILLIE DAVIDS, C E DR-EF M' },
              { value: 'AMANDA CARNEIRO DE MELLO, C E-EF M PROFI', label: 'AMANDA CARNEIRO DE MELLO, C E-EF M PROFI' },
              { value: 'FRITZ KLIEWER, C E C-EF M', label: 'FRITZ KLIEWER, C E C-EF M' },
              { value: 'JORGE Q NETTO, C E-EF M P N', label: 'JORGE Q NETTO, C E-EF M P N' },
              { value: 'ANA DIVANIR BORATTO, C E-EFM', label: 'ANA DIVANIR BORATTO, C E-EFM' },
              { value: 'ARNALDO JANSEN, C E PE-EF M PROFIS', label: 'ARNALDO JANSEN, C E PE-EF M PROFIS' },
              { value: 'CORREIA, C E SEN-EF M PROFIS', label: 'CORREIA, C E SEN-EF M PROFIS' },
              { value: 'FRANCISCO PIRES MACHADO, C E-EF M PROFIS', label: 'FRANCISCO PIRES MACHADO, C E-EF M PROFIS' },
              { value: 'LINDA S BACILA, C E PROFA-EF M PROFIS', label: 'LINDA S BACILA, C E PROFA-EF M PROFIS' },
              { value: 'RODRIGUES ALVES, C E-EF M N PROFIS', label: 'RODRIGUES ALVES, C E-EF M N PROFIS' }
            ]}
            required
            icon={<Building size={18} className="text-gray-400" />}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
            >
              Cadastrar Substituto
            </Button>
          </div>
        </form>
      </Card>

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-green-600 mb-4">Substituto cadastrado com sucesso!</h3>
            <p className="text-gray-600 mb-4">O substituto foi registrado no sistema.</p>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowSuccessModal(false)}
                variant="primary"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}