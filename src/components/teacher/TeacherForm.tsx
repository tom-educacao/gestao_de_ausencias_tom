import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { supabase } from '../../lib/supabase';

export default function TeacherForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [hourClass, setHourClass] = useState(""); // Novo estado para hora_aula
  const [unit, setUnit] = useState(""); // Novo estado para unidade
  const [contractType, setContractType] = useState(""); // Novo estado para contract_type
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function fetchDepartments() {
      const { data, error } = await supabase.from("departments").select("id, name");
      if (!error) setDepartments(data);
    }
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Inserir no profiles primeiro
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert([{ email, name: name, role: 'teacher' }])
      .select();

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError.message);
      setLoading(false);
      return;
    }

    // Inserir no teachers
    const { error: teacherError } = await supabase.from("teachers").insert([
      { 
        profile_id: profile[0].id, 
        department_id: departmentId, 
        teaching_period: hourClass, // Adicionando hora_aula
        unit: unit, // Adicionando unidade
        contract_type: contractType // Adicionando categoria
      },
    ]);

    if (teacherError) {
      console.error("Erro ao cadastrar professor:", teacherError.message);
    } else {
      // Alerta de sucesso
      setShowSuccessModal(true);

      // Limpar os campos após o sucesso
      setName("");
      setEmail("");
      setDepartmentId(null);
      setHourClass("");
      setUnit("");
      setContractType("");
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Cadastro de Professores</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full p-2 border rounded"
          required
        />
        <select
          value={departmentId || ""}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="block w-full p-2 border rounded"
          required
        >
          <option value="" disabled>Selecione o departamento</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        {/* Novo campo para Hora da Aula */}
        <input
          type="number"
          placeholder="Hora da Aula"
          value={hourClass}
          onChange={(e) => setHourClass(e.target.value)}
          className="block w-full p-2 border rounded"
          required
        />

        {/* Novo campo para Unidade */}
        <select
          value={unit || ""}
          onChange={(e) => setUnit(e.target.value)}
          className="block w-full p-2 border rounded"
          required
        >
          <option value="" disabled>Selecione a unidade</option>
          <option value="ANTONIO T R DE OLIVEIRA, C E-EF M">ANTONIO T R DE OLIVEIRA, C E-EF M</option>
          <option value="NILO CAIRO, C E-EF M N PROFIS">NILO CAIRO, C E-EF M N PROFIS</option>
          <option value="UNIDADE POLO, C E-EF M PROFIS">UNIDADE POLO, C E-EF M PROFIS</option>
          <option value="LEOCADIA B RAMOS, C E-EF M PROFIS">LEOCADIA B RAMOS, C E-EF M PROFIS</option>
          <option value="MATHIAS JACOMEL, C E-EF M PROFIS">MATHIAS JACOMEL, C E-EF M PROFIS</option>
          <option value="ANIBAL KHURY NETO, C E-EF M PROFIS">ANIBAL KHURY NETO, C E-EF M PROFIS</option>
          <option value="ELIAS ABRAHAO, C E PROF-EF M PROFIS">ELIAS ABRAHAO, C E PROF-EF M PROFIS</option>
          <option value="HILDEBRANDO DE ARAUJO, C E-EF M PROFIS">HILDEBRANDO DE ARAUJO, C E-EF M PROFIS</option>
          <option value="NATALIA REGINATO, C E-EF M PROFIS">NATALIA REGINATO, C E-EF M PROFIS</option>
          <option value="OLIVIO BELICH, C E DEP-EF M">OLIVIO BELICH, C E DEP-EF M</option>
          <option value="AYRTON SENNA DA SILVA, C E-EF M N PROFIS">AYRTON SENNA DA SILVA, C E-EF M N PROFIS</option>
          <option value="GUSTAVO D DA SILVA, C E-EF M PROFIS">GUSTAVO D DA SILVA, C E-EF M PROFIS</option>
          <option value="JUSCELINO K DE OLIVEIRA, C E-EFMPN">JUSCELINO K DE OLIVEIRA, C E-EFMPN</option>
          <option value="TAMANDARE, C E ALM-EF M PROFIS">TAMANDARE, C E ALM-EF M PROFIS</option>
          <option value="RUI BARBOSA, C E C-EF M">RUI BARBOSA, C E C-EF M</option>
          <option value="BELO HORIZONTE, C E-EF M PROFIS">BELO HORIZONTE, C E-EF M PROFIS</option>
          <option value="DURVAL RAMOS FILHO, C E-EF M PROFIS">DURVAL RAMOS FILHO, C E-EF M PROFIS</option>
          <option value="GERALDO FERNANDES, C E D-EF M">GERALDO FERNANDES, C E D-EF M</option>
          <option value="JARDIM SAN RAFAEL, C E DO-EF M">JARDIM SAN RAFAEL, C E DO-EF M</option>
          <option value="KAZUCO OHARA, E E PROF-EF">KAZUCO OHARA, E E PROF-EF</option>
          <option value="NOSSA SRA LOURDES, C E-EF M">NOSSA SRA LOURDES, C E-EF M</option>
          <option value="UBEDULHA C OLIVEIRA, C E PROFA-EF M P N">UBEDULHA C OLIVEIRA, C E PROFA-EF M P N</option>
          <option value="WILLIE DAVIDS, C E DR-EF M">WILLIE DAVIDS, C E DR-EF M</option>
          <option value="AMANDA CARNEIRO DE MELLO, C E-EF M PROFI">AMANDA CARNEIRO DE MELLO, C E-EF M PROFI</option>
          <option value="FRITZ KLIEWER, C E C-EF M">FRITZ KLIEWER, C E C-EF M</option>
          <option value="JORGE Q NETTO, C E-EF M P N">JORGE Q NETTO, C E-EF M P N</option>
          <option value="ANA DIVANIR BORATTO, C E-EFM">ANA DIVANIR BORATTO, C E-EFM</option>
          <option value="ARNALDO JANSEN, C E PE-EF M PROFIS">ARNALDO JANSEN, C E PE-EF M PROFIS</option>
          <option value="CORREIA, C E SEN-EF M PROFIS">CORREIA, C E SEN-EF M PROFIS</option>
          <option value="FRANCISCO PIRES MACHADO, C E-EF M PROFIS">FRANCISCO PIRES MACHADO, C E-EF M PROFIS</option>
          <option value="LINDA S BACILA, C E PROFA-EF M PROFIS">LINDA S BACILA, C E PROFA-EF M PROFIS</option>
          <option value="RODRIGUES ALVES, C E-EF M N PROFIS">RODRIGUES ALVES, C E-EF M N PROFIS</option>
        </select>

        {/* Novo campo para Tipo de Contrato */}
        <select
          value={contractType || ""}
          onChange={(e) => setContractType(e.target.value)}
          className="block w-full p-2 border rounded"
          required
        >
          <option value="" disabled>Selecione a categoria</option>
          <option value="GPES">GPES</option>
          <option value="MUN">MUN</option>
          <option value="QFEB">QFEB</option>
          <option value="QPM">QPM</option>
          <option value="REPR">REPR</option>
          <option value="S100">S100</option>
          <option value="SC02">SC02</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded">
            <h3 className="text-lg font-bold">Professor registrado com sucesso!</h3>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-4 bg-blue-500 text-white p-2 rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
