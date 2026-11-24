-- Aumento de quadro passa a exigir aprovação da diretoria antes de ir para
-- recrutamento. `pendente_aprovacao` é o status inicial desse tipo de vaga,
-- separado de `em_aberto` (que recrutador já pode trabalhar).
alter type public.situacao_vaga add value 'pendente_aprovacao';
